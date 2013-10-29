# FxStumbler

Firefox OS Stumbler for Mozilla [http://location.services.mozilla.com]().

This application uses API only available to certified apps. So you can only install it on a developer phone. You need to [enable remote debugging](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox_OS/Debugging/Developer_settings#Remote_debugging) on your phone.

To push the application to the phone, I [push it from the Firefox OS Simulator](https://developer.mozilla.org/en-US/docs/Tools/Firefox_OS_Simulator#Push_to_device).


To create the package, use 

    rm stumbler.zip && zip -r stumbler.zip index.html js locales manifest.webapp style

