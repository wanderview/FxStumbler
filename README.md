# FxStumbler

Firefox OS Stumbler for Mozilla [http://location.services.mozilla.com](http://location.services.mozilla.com).

This application uses API only available to certified apps. So you can only install it on a developer phone. You need to [enable remote debugging](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox_OS/Debugging/Developer_settings#Remote_debugging) on your phone.

To push the application to the phone, I [push it from the Firefox OS Simulator](https://developer.mozilla.org/en-US/docs/Tools/Firefox_OS_Simulator#Push_to_device).

** Current status of debugging certified applications **

 - Simulator seems [broken with 1.2 and 1.3](https://bugzilla.mozilla.org/show_bug.cgi?id=928527) so you won’t be able to use it to push the application to your device ;
 - to use the new App Manager, you need a [development build of Firefox OS 1.2](https://developer.mozilla.org/fr/docs/Mozilla/Firefox_OS/Using_the_App_Manager#Debugging_Certified_Apps) ;

Furthermore, [“the marketplace can not distribute apps that use certified APIs”](https://groups.google.com/forum/#!topic/mozilla.dev.marketplace/vY3Rj3tWXuU). That’s a sad news, because it means that this application will only be available to developers.

To create the package, use 

    rm stumbler.zip && zip -r stumbler.zip index.html js locales manifest.webapp style

## Troubleshooting GeoLocation

On my Keon, geolocation seems very inaccurate. So I added the ability to select current location on a card with a custom Web Activity. To use it, you need to install another application which implements `clochix.geoloc` Web Activity (see my [hereIam](https://github.com/clochix/hereIam) application) and check the "Ask" radio button. In this mode, monitoring of position changes is currently disabled;
