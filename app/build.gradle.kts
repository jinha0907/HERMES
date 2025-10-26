plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.example.hermes"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.example.hermes"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = "11"
    }
    //buildToolsVersion = "36.0.0"
}




dependencies {

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.activity)
    implementation(libs.androidx.constraintlayout)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    implementation("com.github.hannesa2:paho.mqtt.android:4.2.3")
    implementation("org.eclipse.paho:org.eclipse.paho.client.mqttv3:1.2.5")
    implementation("androidx.localbroadcastmanager:localbroadcastmanager:1.1.0")
    //implementation("org.eclipse.paho:org.eclipse.paho.android.service:1.1.1")
    //implementation("com.github.hannesa2:paho.mqtt.android:3.3.5")
    //implementation("info.mqtt.android:mqtt-android:3.1.0")
    //implementation("info.mqtt.android:mqtt-android:3.5.3")
    //implementation("androidx.localbroadcastmanager:localbroadcastmanager:1.1.0")
    //implementation("androidx.activity:activity-ktx:1.9.0")
}