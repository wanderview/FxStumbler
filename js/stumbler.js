//jshint browser: true
/*global asyncStorage: true */
/*exported createMock */
var result,
    watchId,
    items = [],
    item,
    nbItems,
    curPos,
    curCell,
    options;
options = {
  geoloc: 'GPS',
  action: 'send',
  logLevel: 'debug',
  accuracy: 50,
  delta: 10,
  username: ''
};
function $$(sel, root) {  "use strict"; root = root || document; return [].slice.call(root.querySelectorAll(sel)); }
var utils = {
  format:  function format(str) {
    "use strict";
    var params = Array.prototype.splice.call(arguments, 1);
    return (str.replace(/%s/g, function () {return params.shift(); }));
  },
  logLevel: 'debug',
  logLevels: ['debug', 'info', 'warning', 'error'],
  log: function log() {
    "use strict";
    var args     = Array.prototype.slice.call(arguments),
        level    = args.pop(),
        levelNum = utils.logLevels.indexOf(level),
        message,
        res;

    function getDate() {
      var d = new Date();
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().substr(11, 8);
    }
    if (levelNum === -1) {
      console.log("Unknown log level " + level);
    }
    if (levelNum >= utils.logLevels.indexOf(utils.logLevel)) {
      if (args.length === 1) {
        message = args[0];
        if (typeof message === 'object') {
          message = JSON.stringify(message, null, '  ');
        }
      } else {
        message = utils.format.apply(null, args);
      }
      res = result.innerHTML.split("\n").slice(0, 100);
      res.unshift(utils.format('<span class="%s">[%s][%s]</span> %s', level, getDate(), level, message));
      result.innerHTML = res.join("\n");
    }
  }
};
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
  utils.log("[Send] Sending…", "debug");
  utils.log(items, "debug");
  try {
    xhr = new XMLHttpRequest(options);
    xhr.open("POST", "https://location.services.mozilla.com/v1/submit", false);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    if (username !== '') {
      xhr.setRequestHeader("X-Nickname", username);
    }
    xhr.send(JSON.stringify({items: items}));
    if (xhr.status === 204) {
      utils.log("[Send] Done sending %s measurements", items.length, "info");
      items = [];
      if (cb) {
        cb();
      }
    } else {
      try {
        utils.log("[Send] Error sending datas: ", "error");
        res = JSON.parse(xhr.responseText).errors;
        res.forEach(function (error) { utils.log(error, "error"); });
      } catch (e) {
        utils.log("[Send] Unable to parse response: " + e, "error");
      }
    }
  } catch (e) {
    utils.log("[Send] Error sending datas: " + e, "error");
  }
}
function search() {
  //jshint maxstatements: 30
  "use strict";
  var xhr, options, res;
  options = {
    mozAnon: true,
    mozSystem: true
  };
  utils.log("[Search] Searching…", "debug");
  try {
    if (item.cell.length > 0) {
      item.radio = item.cell[0].radio;
    }
    utils.log(item, "debug");
    xhr = new XMLHttpRequest(options);
    xhr.open("POST", "https://location.services.mozilla.com/v1/search", false);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(item));
    if (xhr.status === 200) {
      res = JSON.parse(xhr.responseText);
      if (res.status === "ok") {
        utils.log("[Search] OK\nlat: %s\nlon: %s\naccuracy: %s", res.lat, res.lon, res.accuracy, "info");
      } else {
        utils.log("[Search] " + res.status, "error");
      }
    } else {
      utils.log("[Search] K0: %s - %s - %s", xhr.status, xhr.statusText, xhr.responseText, "error");
    }
  } catch (e) {
    utils.log('[Search] Error sending datas: ' + e, "error");
  }
  items = [];
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
            utils.log("Error retrieving stored items: " + e, "error");
            value = [];
          }
          value = value.concat(items);
        }
        asyncStorage.setItem('items', JSON.stringify(value), function () {
          utils.log("Done adding %s items. %s items stored.", items.length, value.length, "info");
          nbItems.innerHTML = value.length;
          items = [];
        });
      });
      break;
    case 'nothing':
      utils.log("Done", "info");
      utils.log(items, "debug");
      break;
    }
  } catch (e) {
    utils.log("Error in onInfosCollected: " + e, "error");
  }
}
// Cell {{
function getCellInfos() {
  "use strict";
  var conn, data, voice, cell = {}, type, tr;
  utils.log("[cell] Getting cell infos", "debug");
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
    utils.log("[cell] Done", "debug");
  } catch (e) {
    utils.log("[cell] Error : " + e, "error");
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

  function onWifiInfos(networks) {
    try {
      item.wifi = networks;
      items.push(item);
      cb();
    } catch (e) {
      utils.log("[wifi] Error onWifiInfos: " + e, "error");
    }
  }

  utils.log("[wifi] Getting Wifi infos", "debug");
  try {
    wifi     = navigator.mozWifiManager;
    request  = wifi.getNetworks();
    request.onsuccess = function () {
      utils.log("[wifi] found " + this.result.length + " networks", "info");
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
      utils.log("[wifi] Done", "debug");
      onWifiInfos(networks);
    };
    request.onerror = function (err) {
      utils.log('[wifi] Something goes wrong: ' + request.error.name, "error");
      onWifiInfos(networks);
    };
  } catch (e) {
    utils.log('[wifi] Something goes wrong: ' + e, "error");
    onWifiInfos(networks);
  }
}
// }}
// Geoloc {{
function onGeolocSuccess(pos) {
  "use strict";
  try {
    item = {};
    item.cell     = [ getCellInfos() ];
    item.lat      = pos.coords.latitude;
    item.lon      = pos.coords.longitude;
    item.accuracy = pos.coords.accuracy;
    utils.log("[geoloc] Done: %s / %s / %s", item.accuracy, item.lat, item.lon, "info");

    if (item.accuracy > options.accuracy) {
      utils.log("[geoloc] Not accurate : " + item.accuracy, "error");
    } else {
      getWifiInfos(onInfosCollected);
    }
  } catch (e) {
    utils.log("[geoloc] Error in onGeolocSuccess: " + pos, "error");
  }
}
function onGeolocError(err) {
  "use strict";
  utils.log('[geoloc] Error: ' + err.code + ' : ' + err.message, "error");
  utils.log('[geoloc] Aborting.', "error");
}
// }}

function getGeolocOptions() {
  "use strict";
  return {
    enableHighAccuracy: document.getElementById('geoAccur').checked,
    timeout: parseInt(document.getElementById('geoTo').value, 10),
    maximumAge: parseInt(document.getElementById('geoMax').value, 10)
  };
}
function getGeoloc() {
  "use strict";

  utils.log("Getting infos", "debug");

  if (document.querySelector('[name=geoloc]:checked').value === 'GPS') {
    navigator.geolocation.getCurrentPosition(onGeolocSuccess, onGeolocError, getGeolocOptions());
  } else {
    var activity = new window.MozActivity({
      name: "clochix.geoloc"
    });
    activity.onsuccess = function () {
      onGeolocSuccess(this.result);
    };
    activity.onerror = function () {
      utils.log('[geoloc] Error getting location: ' + this.error.name, "error");
      utils.log('[geoloc] Aborting.', "error");
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
        utils.log("[cell] New cell: " + curCell, "debug");
        getGeoloc();
      }
    }
  } catch (e) {
    utils.log("Error in onVoiceChange: " + e, "error");
  }
}
function onPosChange(pos) {
  "use strict";
  function distance(p1, p2) {
    function rad(r) { return r * Math.PI / 180; }
    var R    = 6371, // Radius of the earth in km
        dLat = rad(p2.latitude - p1.latitude),
        dLon = rad(p2.longitude - p1.longitude),
        a    = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
               Math.cos(rad(p1.latitude)) * Math.cos(rad(p2.latitude)) *
               Math.sin(dLon / 2) * Math.sin(dLon / 2),
        c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
        d = R * c * 1000; // Distance in m
    return d;
  }
  try {
    if (typeof curPos === 'undefined') {
      curPos = {};
      curPos.latitude  = pos.coords.latitude;
      curPos.longitude = pos.coords.longitude;
      curPos.accuracy  = pos.coords.accuracy;
    }
    var delta = distance(curPos, pos.coords);
    if (delta < parseInt(options.distance, 10) || pos.coords.accuracy < 0.8 * curPos.accuracy) {
      utils.log("[geoloc] New position:" + pos.coords.accuracy + "/" + pos.coords.latitude + "/" + pos.coords.longitude, "info");
      curPos.latitude  = pos.coords.latitude;
      curPos.longitude = pos.coords.longitude;
      curPos.accuracy  = pos.coords.accuracy;
      if (curPos.accuracy > options.accuracy) {
        utils.log("[geoloc] Not accurate : " + curPos.accuracy, "error");
      } else {
        onGeolocSuccess(pos);
      }
    } else {
      utils.log("[geoloc] Difference too small : " + delta, "debug");
    }
  } catch (e) {
    utils.log("Error in onPosChange: " + e, "error");
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
    watchId = navigator.geolocation.watchPosition(onPosChange, onGeolocError, getGeolocOptions());
  } catch (e) {
    utils.log("Error in startMonitoring: " + e, "error");
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
  //jshint maxstatements: 30
  var onAccuracyChange, onDeltaChange;
  function onSliderChange(option, target) {
    var fct = function (event) {
      if (event) {
        options[option] = event.target.value;
        document.getElementById(target).textContent = event.target.value;
      } else {
        document.getElementById(target).textContent = options[option];
      }
    };
    return fct;
  }
  function saveOptions() {
    asyncStorage.setItem('options', options);
  }
  try {
    result  = document.getElementById("result");
    nbItems = document.getElementById("nbItems");
    document.body.addEventListener('click', function (event) {
      var elmt;
      if (event.target.dataset.target) {
        elmt = document.getElementById(event.target.dataset.target);
        if (elmt) {
          elmt.classList.toggle('hidden');
        }
      }
    });
    document.getElementById('mobile').addEventListener('click', getGeoloc);
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
        utils.log("Error in clearLogs: " + e, "error");
      }
      return false;
    });
    document.getElementById('search').addEventListener('click', function (event) {
      event.preventDefault();
      item = {};
      item.cell = [ getCellInfos() ];
      getWifiInfos(search);
      return false;
    });
    document.getElementById('displayStorage').addEventListener('click', function (event) {
      event.preventDefault();
      try {
        result.textContent = '';
        asyncStorage.getItem('items', function (value) {
          if (value === null) {
            value = items;
            utils.log("Nothing stored", "info");
          } else {
            try {
              value = JSON.parse(value);
              utils.log("Number of items: " + value.length, "info");
              utils.log(value, "info");
            } catch (e) {
              utils.log("Error retrieving stored items: " + e, "error");
            }
          }
        });
      } catch (e) {
        utils.log("Error in displayStorage: " + e, "error");
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
            utils.log('Nothing to send', "warning");
          } else {
            try {
              items = JSON.parse(value);
              toSend = items.length;
              send(function onSent() {
                utils.log("Done sending " + toSend + " items", "info");
                asyncStorage.setItem('items', JSON.stringify([]), function () {
                  utils.log("Done reseting storage", "info");
                  nbItems.innerHTML = "0";
                });
              });
            } catch (e) {
              utils.log("Error retrieving stored items: " + e, "error");
            }
          }
        });
      } catch (e) {
        utils.log("Error in sendStorage: " + e, "error");
      }
      return false;
    });
    document.getElementById('clearStorage').addEventListener('click', function (event) {
      event.preventDefault();
      if (window.confirm("Do you really want to delete local storage?")) {
        try {
          result.textContent = '';
          asyncStorage.removeItem('items', function () {
            utils.log("Storage deleted", "info");
            nbItems.innerHTML = "0";
          });
        } catch (e) {
          utils.log("Error in clearStorage: " + e, "error");
        }
      }
      return false;
    });
    document.getElementById('settingsLogLevel').addEventListener('change', function (event) {
      utils.logLevel   = this.value;
      options.logLevel = this.value;
      saveOptions();
    });
    utils.logLevel = document.getElementById('settingsLogLevel').value;

    onAccuracyChange = onSliderChange('accuracy', 'accuracyValue');
    document.getElementById('accuracy').addEventListener('input', onAccuracyChange);
    document.getElementById('accuracy').addEventListener('change', onAccuracyChange);
    document.getElementById('accuracy').addEventListener('change', saveOptions);

    onDeltaChange = onSliderChange('delta', 'deltaValue');
    document.getElementById('delta').addEventListener('input', onDeltaChange);
    document.getElementById('delta').addEventListener('change', onDeltaChange);
    document.getElementById('delta').addEventListener('change', saveOptions);

    $$("[name=geoloc]").forEach(function (e) {
      e.addEventListener('change', function () {
        if (this.checked) {
          options.geoloc = this.value;
          saveOptions();
        }
      });
    });
    $$("[name=action]").forEach(function (e) {
      e.addEventListener('change', function () {
        if (this.checked) {
          options.action = this.value;
          saveOptions();
        }
      });
    });

    asyncStorage.getItem('options', function (val) {
      if (val) {
        // Default values
        options.accuracy = val.accuracy || 50;
        options.action   = val.action   || 'store';
        options.delta    = val.accuracy || 10;
        options.geoloc   = val.geoloc   || 'GPS';
        options.logLevel = val.logLevel || 'debug';
        options.username = val.username || '';
      } else {
        options.accuracy = 50;
        options.action   = 'store';
        options.delta    = 10;
        options.geoloc   = 'GPS';
        options.logLevel = 'debug';
        options.username = '';
      }
      // Init options
      onAccuracyChange();
      onDeltaChange();
      utils.logLevel = options.logLevel;
      document.getElementById('settingsLogLevel').value = options.logLevel;
      document.querySelector("[name=username]").value = options.username;
      $$("[name=geoloc]").forEach(function (e) {
        e.checked = (e.value === options.geoloc);
      });
      $$("[name=action]").forEach(function (e) {
        e.checked = (e.value === options.action);
      });
    });

    try {
      asyncStorage.getItem('items', function (value) {
        if (value === null) {
          nbItems.innerHTML = "0";
        } else {
          try {
            value = JSON.parse(value);
            nbItems.innerHTML = value.length;
          } catch (e) {
            utils.log("Error retrieving stored items: " + e, "error");
          }
        }
      });
    } catch (e) {
      utils.log("Error in displayStorage: " + e, "error");
    }
  } catch (e) {
    console.log(e);
    utils.log(e.toString(), "error");
  }
});
// {{ Create Mock
function createMock() {
  "use strict";
  navigator.mozWifiManager = {
    getNetworks: function () {
      var res = {};
      window.setTimeout(function () {
        var self = {
          result: [
            {
              ssid: '00:00:00:00',
              signalStrengh: 0
            }
          ]
        };
        res.onsuccess.call(self);
      }, 500);
      return res;
    }
  };
  var info = {
    'type': 'gsm',
    'network': {
      'mcc': 'mcc',
      'mnc': 'mnc'
    },
    'cell': {
      'gsmLocationAreaCode': '123',
      'gsmCellId': '456'
    },
    'signalStrength': 1
  };
  navigator.mozMobileConnection = {
    data: info,
    voice: info
  };
  window.MozActivity = function (options) {
    var self = this;
    window.setTimeout(function () {
      var res = {
        result: {
          coords: {
            latitude: 48.856578,
            longitude: 2.351828,
            accuracy: 500
          }
        }
      };
      self.onsuccess.call(res);
    }, 500);
  };
}

// }}

