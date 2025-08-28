package com.mlb.playbyplay.di

import android.content.Context
import androidx.room.Room
import com.mlb.playbyplay.data.AppDatabase
import com.mlb.playbyplay.network.MlbStatsApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.Cache
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideCache(@ApplicationContext context: Context): Cache =
        Cache(directory = context.cacheDir.resolve("http_cache"), maxSize = 20L * 1024L * 1024L)

    @Provides
    @Singleton
    fun provideOkHttp(cache: Cache): OkHttpClient {
        val logger = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC }
        val userAgent = Interceptor { chain ->
            val req = chain.request().newBuilder()
                .header("User-Agent", "MLBPlayByPlay/1.0 (okhttp)")
                .build()
            chain.proceed(req)
        }
        val cacheControl = Interceptor { chain ->
            val response = chain.proceed(chain.request())
            response.newBuilder()
                .header("Cache-Control", "public, max-age=15") // short cache, reduce API hits
                .build()
        }
        return OkHttpClient.Builder()
            .cache(cache)
            .addInterceptor(userAgent)
            .addInterceptor(logger)
            .addNetworkInterceptor(cacheControl)
            .build()
    }

    @Provides
    @Singleton
    fun provideApi(client: OkHttpClient): MlbStatsApi = Retrofit.Builder()
        .baseUrl("https://statsapi.mlb.com")
        .addConverterFactory(MoshiConverterFactory.create())
        .client(client)
        .build()
        .create(MlbStatsApi::class.java)

    @Provides
    @Singleton
    fun provideDb(@ApplicationContext context: Context): AppDatabase =
    Room.databaseBuilder(context, AppDatabase::class.java, "mlb.db").fallbackToDestructiveMigration().build()
}
