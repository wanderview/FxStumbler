//jshint browser: true
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
function send() {
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
    //xhr.open("POST", "https://location.services.mozilla.com/v1/submit", false);
    xhr.open("POST", "http://clochix.net", false);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    if (username !== '') {
      xhr.setRequestHeader("X-Nickname", username);
    }
    xhr.send(JSON.stringify({items: items}));
    if (xhr.status === 204) {
      log("[Send] OK");
      items = [];
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
// Cell {{
function getCellInfos() {
  "use strict";
  var conn, data, voice, cell = {};
  log("[cell] Getting cell infos");
  try {
    conn  = window.navigator.mozMobileConnection;
    data  = conn.data;
    voice = conn.voice;
    cell.radio  = voice.type;
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
  item.wifi = networks;
  item.cell = [ getCellInfos() ];
  items.push(item);
  send(items);
}
// }}
// Geoloc {{
function onGeolocSuccess(pos) {
  "use strict";
  log("[geoloc] Done");
  item = {};
  item.lat      = pos.coords.latitude;
  item.lon      = pos.coords.longitude;
  item.accuracy = pos.coords.accuracy;

  getWifiInfos(onWifiInfos);
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
  navigator.geolocation.getCurrentPosition(onGeolocSuccess, onGeolocError, geoOptions);

  return false;
}
function onVoiceChange() {
  "use strict";
  var conn = window.navigator.mozMobileConnection;
  if (conn && conn.voice) {
    if (curCell !== conn.voice.cell.gsmCellId) {
      curCell = conn.voice.cell.gsmCellId;
      log("[cell] New cell: " + curCell);
      getMobileInfos();
    }
  }
}
function onPosChange(pos) {
  "use strict";
  if (curPos.latitude !== pos.coords.latitude || curPos.longitude !== pos.coords.longitude || curPos.accuracy !== pos.coords.accuracy) {
    log("[geoloc] New position:" + pos.coords.latitude + "/" + pos.coords.longitude + "/" + pos.coords.accuracy);
    curPos.latitude  = pos.coords.latitude;
    curPos.longitude = pos.coords.longitude;
    curPos.accuracy  = pos.coords.accuracy;
    onGeolocSuccess(pos);
  }
}
function startMonitoring() {
  "use strict";
  var conn = window.navigator.mozMobileConnection;
  if (conn && conn.voice) {
    conn.addEventListener('voicechange', onVoiceChange);
  }
  watchId = navigator.geolocation.watchPosition(onPosChange, onGeolocError, geoOptions);
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
  document.getElementById('clear').addEventListener('click', function () {
    result.textContent = '';
  });
});

