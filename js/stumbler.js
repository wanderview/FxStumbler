//jshint browser: true
/*global asyncStorage: true */
var result,
    watchId,
    items = [],
    item,
    geoOptions,
    curPos = {},  // Current Geoloc
    curCell;      // Current Cell Id
var geoOptions = {
  enableHighAccuracy: true,
  timeout: 60000, // 1 minute
  maximumAge: 0
};
function log(message) {
  "use strict";
  if (typeof message === 'object') {
    message = JSON.stringify(message, null, '  ');
  }
  result.textContent += '[' + new Date().toISOString().substr(11, 8) + ']' + message + "\n";
}
// send {{
function send(cb) {
  //jshint maxstatements: 30
  "use strict";
  var xhr, res, options, username;
  username = document.querySelector("[name=username]").value.replace(/^\s+/g, '').replace(/\s+$/g, '');
  options = {
    mozAnon: true,
    mozSystem: true
  };
  log("[Send] Sending…");
  log(items);
  try {
    xhr = new XMLHttpRequest(options);
    xhr.open("POST", "https://location.services.mozilla.com/v1/submit", false);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    if (username !== '') {
      xhr.setRequestHeader("X-Nickname", username);
    }
    xhr.send(JSON.stringify({items: items}));
    if (xhr.status === 204) {
      log("[Send] OK");
      items = [];
      if (cb) {
        cb();
      }
    } else {
      log("[Send] K0");
      try {
        log("[Send] Error sending datas: ");
        res = JSON.parse(xhr.responseText).errors;
        res.forEach(function (error) { log(error); });
      } catch (e) {
        log('[Send] Unable to parse response: ' + e);
      }
    }
  } catch (e) {
    log('[Send] Error sending datas: ' + e);
  }
}
// }}
function onInfosCollected() {
  "use strict";
  try {
    switch (document.querySelector('[name=action]:checked').value) {
    case 'send':
      send();
      break;
    case 'store':
      asyncStorage.getItem('items', function (value) {
        if (value === null) {
          value = items;
        } else {
          try {
            value = JSON.parse(value);
          } catch (e) {
            log("Error retrieving stored items: " + e);
            value = [];
          }
          value = value.concat(items);
        }
        asyncStorage.setItem('items', JSON.stringify(value), function () {
          log("Done adding " + items.length + " items. " + value.length + " items stored");
          items = [];
        });
      });
      break;
    case 'nothing':
      log("Done");
      log(items);
      break;
    }
  } catch (e) {
    log("Error in onInfosCollected: " + e);
  }
}
// Cell {{
function getCellInfos() {
  "use strict";
  var conn, data, voice, cell = {}, type, tr;
  log("[cell] Getting cell infos");
  // Convert radio type
  tr = {
    'gsm': ["gsm", "edge", "gprs", "hspa", "hsdpa", "hspa+", "hsupa"],
    'cdma': ["cdma", "evdo", "ehrpd"]
  };

  try {
    conn  = window.navigator.mozMobileConnection;
    data  = conn.data;
    voice = conn.voice;
    type  = voice.type;
    Object.keys(tr).forEach(function (radio) {
      if (tr[radio].indexOf(type) !== -1) {
        type = radio;
      }
    });
    cell.radio  = type;
    cell.mcc    = voice.network.mcc;
    cell.mnc    = voice.network.mnc;
    cell.lac    = voice.cell.gsmLocationAreaCode;
    cell.cid    = voice.cell.gsmCellId;
    cell.signal = voice.signalStrength;
    cell.asu    = undefined;
    cell.ta     = undefined;
    cell.psc    = undefined;
    log("[cell] Done");
  } catch (e) {
    log("[cell] Error : " + e);
  }
  return cell;
}
// }}
// Wifi {{
function getWifiInfos(cb) {
  "use strict";
  var wifi,
      request,
      networks = [];

  log("[wifi] Getting Wifi infos");
  try {
    wifi     = navigator.mozWifiManager;
    request  = wifi.getNetworks();
    request.onsuccess = function () {
      log("[wifi] found " + this.result.length + " networks");
      this.result.forEach(function (network) {
        var net;
        if (!/_nomap/.test(network.ssid)) {
          net = {
            key: network.bssid,
            channel: undefined,
            frequency: undefined,
            signal: network.signalStrength
          };
          networks.push(net);
        }
      });
      log("[wifi] Done");
      cb(networks);
    };
    request.onerror = function (err) {
      log('[wifi] Something goes wrong: ' + err);
      cb(networks);
    };
  } catch (e) {
    log('[wifi] Something goes wrong: ' + e);
    cb(networks);
  }
}
function onWifiInfos(networks) {
  "use strict";
  try {
    item.wifi = networks;
    item.cell = [ getCellInfos() ];
    items.push(item);
    onInfosCollected();
  } catch (e) {
    log("[wifi] Error onWifiInfos: " + e);
  }
}
// }}
// Geoloc {{
function onGeolocSuccess(pos) {
  "use strict";
  try {
    item = {};
    item.lat      = pos.coords.latitude;
    item.lon      = pos.coords.longitude;
    item.accuracy = pos.coords.accuracy;
    log("[geoloc] Done: " + item.lat + '/' + item.lon + '/' + item.accuracy);

    getWifiInfos(onWifiInfos);
  } catch (e) {
    log("[geoloc] Error in onGeolocSuccess: " + pos);
  }
}
function onGeolocError(err) {
  "use strict";
  log('[geoloc] Error: ' + err.code + ' : ' + err.message);
  log('[geoloc] Aborting.');
}
// }}

function getMobileInfos() {
  "use strict";

  log("Getting infos");

  if (document.querySelector('[name=geoloc]:checked').value === 'GPS') {
    navigator.geolocation.getCurrentPosition(onGeolocSuccess, onGeolocError, geoOptions);
  } else {
    var activity = new window.MozActivity({
      name: "clochix.geoloc"
    });
    activity.onsuccess = function () {
      onGeolocSuccess(this.result);
    };
    activity.onerror = function () {
      log('[geoloc] Error getting location: ' + this.error.name);
      log('[geoloc] Aborting.');
    };
  }

  return false;
}
function onVoiceChange() {
  "use strict";
  try {
    var conn = window.navigator.mozMobileConnection;
    if (conn && conn.voice) {
      if (curCell !== conn.voice.cell.gsmCellId) {
        curCell = conn.voice.cell.gsmCellId;
        log("[cell] New cell: " + curCell);
        getMobileInfos();
      }
    }
  } catch (e) {
    log("Error in onVoiceChange: " + e);
  }
}
function onPosChange(pos) {
  "use strict";
  try {
    if (curPos.latitude !== pos.coords.latitude || curPos.longitude !== pos.coords.longitude || curPos.accuracy !== pos.coords.accuracy) {
      log("[geoloc] New position:" + pos.coords.latitude + "/" + pos.coords.longitude + "/" + pos.coords.accuracy);
      curPos.latitude  = pos.coords.latitude;
      curPos.longitude = pos.coords.longitude;
      curPos.accuracy  = pos.coords.accuracy;
      onGeolocSuccess(pos);
    }
  } catch (e) {
    log("Error in onPosChange: " + e);
  }
}
function startMonitoring() {
  "use strict";
  try {
    if (document.querySelector('[name=geoloc]:checked').value !== 'GPS') {
      window.alert("Monitoring is only available when using GPS");
      return false;
    }
    var conn = window.navigator.mozMobileConnection;
    if (conn && conn.voice) {
      conn.addEventListener('voicechange', onVoiceChange);
    }
    watchId = navigator.geolocation.watchPosition(onPosChange, onGeolocError, geoOptions);
  } catch (e) {
    log("Error in startMonitoring: " + e);
  }
}
function stopMonitoring() {
  "use strict";
  var conn = window.navigator.mozMobileConnection;
  if (conn) {
    conn.removeEventListener('voicechange', onVoiceChange);
  }
  navigator.geolocation.clearWatch(watchId);
}
window.addEventListener("load", function () {
  "use strict";
  try {
    result = document.getElementById("result");
    document.getElementById('mobile').addEventListener('click', getMobileInfos);
    document.getElementById('monitor').addEventListener('click', function () {
      if (this.dataset.state === 'stopped') {
        startMonitoring();
        this.dataset.state = "started";
        this.textContent   = "Stop monitoring";
      } else {
        stopMonitoring();
        this.dataset.state = "stopped";
        this.textContent   = "Start monitoring";
      }
    });
    document.getElementById('clearLogs').addEventListener('click', function (event) {
      event.preventDefault();
      try {
        result.textContent = '';
      } catch (e) {
        log("Error in clearLogs: " + e);
      }
      return false;
    });
    document.getElementById('displayStorage').addEventListener('click', function (event) {
      event.preventDefault();
      try {
        result.textContent = '';
        asyncStorage.getItem('items', function (value) {
          if (value === null) {
            value = items;
            log("Nothing stored");
          } else {
            try {
              value = JSON.parse(value);
              log("Number of items: " + value.length);
              log(value);
            } catch (e) {
              log("Error retrieving stored items: " + e);
            }
          }
        });
      } catch (e) {
        log("Error in displayStorage: " + e);
      }
      return false;
    });
    document.getElementById('sendStorage').addEventListener('click', function (event) {
      event.preventDefault();
      try {
        result.textContent = '';
        asyncStorage.getItem('items', function (value) {
          var toSend = 0;
          if (value === null) {
            log('Nothing to send');
          } else {
            try {
              items = JSON.parse(value);
              toSend = items.length;
              send(function onSent() {
                log("Done sending " + toSend + " items");
                asyncStorage.setItem('items', JSON.stringify([]), function () {
                  log("Done reseting storage");
                });
              });
            } catch (e) {
              log("Error retrieving stored items: " + e);
            }
          }
        });
      } catch (e) {
        log("Error in sendStorage: " + e);
      }
      return false;
    });
    document.getElementById('clearStorage').addEventListener('click', function (event) {
      event.preventDefault();
      try {
        result.textContent = '';
        asyncStorage.removeItem('items', function () {
          log("Storage deleted");
        });
      } catch (e) {
        log("Error in clearStorage: " + e);
      }
      return false;
    });
  } catch (e) {
    log(e);
  }
});

