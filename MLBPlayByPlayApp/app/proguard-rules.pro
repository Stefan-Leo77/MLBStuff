# Keep Moshi/Kotlin reflect for data classes
-keepclassmembers class ** {
    @com.squareup.moshi.Json <fields>;
}
-keep @com.squareup.moshi.JsonClass class * { *; }
-keep class kotlin.Metadata { *; }

# Hilt/DI
-keep class dagger.hilt.** { *; }
-keep class * extends dagger.hilt.internal.GeneratedComponent { *; }
-keep class * extends dagger.hilt.internal.GeneratedModule { *; }
-dontwarn dagger.hilt.internal.**
