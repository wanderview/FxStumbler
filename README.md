# FxStumbler

Firefox OS client for [Mozilla Location Service](http://location.services.mozilla.com).

This application uses phone APIs only available to certified apps for the moment ([WifiManager](https://developer.mozilla.org/en-US/docs/Web/API/WifiManager), [MobileConnection](https://developer.mozilla.org/en-US/docs/Web/API/MozMobileConnection)) . So you can only install it on a developer phone. You need to [enable remote debugging](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox_OS/Debugging/Developer_settings#Remote_debugging) on your phone.

To push the application to the phone, you can use the [Firefox OS Simulator](https://developer.mozilla.org/en-US/docs/Tools/Firefox_OS_Simulator#Push_to_device) or the [App Manager](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox_OS/Using_the_App_Manager).

When cloning the repository, don’t forget to update submodules:

    git submodules init
    git submodules update

** Current status of debugging certified applications **

 - Simulator seems [broken with 1.2 and 1.3](https://bugzilla.mozilla.org/show_bug.cgi?id=928527) so you won’t be able to use it to push the application to your device ;
 - to use the new App Manager, you need a [development build of Firefox OS 1.2](https://developer.mozilla.org/fr/docs/Mozilla/Firefox_OS/Using_the_App_Manager#Debugging_Certified_Apps) ;

Furthermore, [“the marketplace can not distribute apps that use certified APIs”](https://groups.google.com/forum/#!topic/mozilla.dev.marketplace/vY3Rj3tWXuU). That’s a sad news, because it means that this application will only be available to developers.

To create the package, use `make all`.

## Usage

### Main actions

 - *Push infos*: get current location, cell and Wifi informations and perform the action selected in the options (default is to push to the Web service);
 - *Start Monitoring*: perform the above action every time location or mobile cell information change;
 - *Get my position* query the Web service to get current position according to mobile cells and wifi networks nearby;
 - *Clear log*: clear the log window;

### Storage options

Collected information can by stored in a local database and sent to the server later. You can display the full content of the database (warning, a huge JSON array), send it or clear all records.

### Options

 - *Geoloc*: how to get current location: GPS or by using another app;
 - *Action*: send data immediately, store them in local database or do nothing;
 - *Username*: if you want your name in the [hall of fame](https://location.services.mozilla.com/leaders);
 - geoloc: allow to fine tune [geolocation options](https://developer.mozilla.org/en-US/docs/Web/API/PositionOptions);
 - min accuracy: data will be ignored if accuracy of geoloc is more than this value (aka if geoloc is not accurate enough);
 - min distance: when watching position change, will only store new data if distance from previous measure is more than this value, in meter, or if accuracy is 20% better;
 - *Log level*: verbosity of logs;

## Troubleshooting GeoLocation

On my Keon, geolocation seems very inaccurate. So I added the ability to select current location on a map with a custom Web Activity. To use it, you need to install another application which implements `clochix.geoloc` Web Activity (see my [hereIam](https://github.com/clochix/hereIam) application) and check the "Ask" radio button. In this mode, monitoring of position changes is currently disabled;

## Release notes

* [2014-01-19]
  - use bigger buttons;
  - add options: minimal accuracy and minimal distance between 2 measures;
  - options should be saved;
  - logs are now hidden by default;
