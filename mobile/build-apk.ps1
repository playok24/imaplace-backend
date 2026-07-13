$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"
$env:ANDROID_HOME = "C:\Users\Gaston H\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = "C:\Users\Gaston H\AppData\Local\Android\Sdk"

Set-Location "D:\IAS\Maps Interactive\mobile\android"
& .\gradlew.bat assembleDebug 2>&1 | Tee-Object -FilePath "build.log"
