//jshint browser: true
var result;
function log(message) {
  "use strict";
  if (typeof message === 'object') {
    message = JSON.stringify(message, null, '  ');
  }
  result.textContent += '[' + new Date().toISOString() + ']' + message + "\n";
}
function getMobileInfos() {
  //jshint maxstatements: 30
  "use strict";
  var options = {
    enableHighAccuracy: true,
    timeout: 60000, // 1 minute
    maximumAge: 0
  },
  items = [],
  item = {};
  result.textContent = '';

  // Cell {{
  function getCellInfos() {
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
    item.wifi = networks;
    item.cell = [ getCellInfos() ];
    items.push(item);
    send(items);
  }
  // }}
  // send {{
  function send() {
    var xhr, res, options;
    options = {
      mozAnon: true,
      mozSystem: true
    };
    log("Sending…");
    log(items);
    try {
      xhr = new XMLHttpRequest(options);
      xhr.open("POST", "https://location.services.mozilla.com/v1/submit", false);
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      xhr.send(JSON.stringify({items: items}));
      if (xhr.status === 204) {
        log("OK");
      } else {
        log("K0");
        try {
          log("Error sending datas: ");
          res = JSON.parse(xhr.responseText).errors;
          res.forEach(function (error) { log(error); });
        } catch (e) {
          log('Unable to parse response: ' + e);
        }
      }
    } catch (e) {
      log('Error sending datas: ' + e);
    }
  }
  // }}
  // Geoloc {{
  function onGeolocSuccess(pos) {
    log("[geoloc] Done");
    item.lat      = pos.coords.latitude;
    item.lon      = pos.coords.longitude;
    item.accuracy = pos.coords.accuracy;

    getWifiInfos(onWifiInfos);
  }
  function onGeolocError(err) {
    log('[geoloc] Error: ' + err.code + ' : ' + err.message);
    log('Aborting.');
    getWifiInfos(onWifiInfos);
  }
  // }}

  navigator.geolocation.getCurrentPosition(onGeolocSuccess, onGeolocError, options);


  return false;
}
/*
function install() {
  "use strict";
  var manifestUrl = 'http://clochix.net/public/stumbler/package.manifest',
      req = navigator.mozApps.installPackage(manifestUrl);
  req.onsuccess = function () {
    alert(this.result.origin);
  };
  req.onerror = function () {
    alert(this.error.name);
  };
  return false;
}
*/
window.addEventListener("load", function () {
  "use strict";
  result = document.getElementById("result");
  //document.getElementById('install').addEventListener('click', install);
  document.getElementById('mobile').addEventListener('click', getMobileInfos);
});

