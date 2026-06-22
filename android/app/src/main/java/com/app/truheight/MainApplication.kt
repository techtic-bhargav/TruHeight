package com.app.truheight
import com.facebook.react.common.assets.ReactFontManager

import android.app.Application
import android.content.res.Configuration

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
      this,
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
            }

          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      }
  )

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    // @generated begin xml-fonts-init - expo prebuild (DO NOT MODIFY) sync-6a606cfde752ade6624a92bbc49165b31184e81c
    ReactFontManager.getInstance().addCustomFont(this, "Butler-Black", R.font.xml_butler_black)
    ReactFontManager.getInstance().addCustomFont(this, "Butler-Bold", R.font.xml_butler_bold)
    ReactFontManager.getInstance().addCustomFont(this, "Butler-ExtraBold", R.font.xml_butler_extra_bold)
    ReactFontManager.getInstance().addCustomFont(this, "Butler-Light", R.font.xml_butler_light)
    ReactFontManager.getInstance().addCustomFont(this, "Butler-Medium", R.font.xml_butler_medium)
    ReactFontManager.getInstance().addCustomFont(this, "Butler-Regular", R.font.xml_butler_regular)
    ReactFontManager.getInstance().addCustomFont(this, "Butler-UltraLight", R.font.xml_butler_ultra_light)
    ReactFontManager.getInstance().addCustomFont(this, "OwnersText-Black", R.font.xml_owners_text_black)
    ReactFontManager.getInstance().addCustomFont(this, "OwnersText-BlackItalic", R.font.xml_owners_text_black_italic)
    ReactFontManager.getInstance().addCustomFont(this, "OwnersText-Bold", R.font.xml_owners_text_bold)
    ReactFontManager.getInstance().addCustomFont(this, "OwnersText-BoldItalic", R.font.xml_owners_text_bold_italic)
    ReactFontManager.getInstance().addCustomFont(this, "OwnersText-Light", R.font.xml_owners_text_light)
    ReactFontManager.getInstance().addCustomFont(this, "OwnersText-LightItalic", R.font.xml_owners_text_light_italic)
    ReactFontManager.getInstance().addCustomFont(this, "OwnersText-Medium", R.font.xml_owners_text_medium)
    ReactFontManager.getInstance().addCustomFont(this, "OwnersText-MediumItalic", R.font.xml_owners_text_medium_italic)
    ReactFontManager.getInstance().addCustomFont(this, "OwnersText-Regular", R.font.xml_owners_text_regular)
    ReactFontManager.getInstance().addCustomFont(this, "OwnersText-RegularItalic", R.font.xml_owners_text_regular_italic)
    ReactFontManager.getInstance().addCustomFont(this, "OwnersText-XLight", R.font.xml_owners_text_x_light)
    ReactFontManager.getInstance().addCustomFont(this, "OwnersText-XLightItalic", R.font.xml_owners_text_x_light_italic)
    // @generated end xml-fonts-init
    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
