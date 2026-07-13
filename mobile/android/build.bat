@echo off
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot
set ANDROID_HOME=C:\Users\Gaston H\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=C:\Users\Gaston H\AppData\Local\Android\Sdk
cd /d D:\IAS\Maps Interactive\mobile\android
gradlew.bat assembleDebug
