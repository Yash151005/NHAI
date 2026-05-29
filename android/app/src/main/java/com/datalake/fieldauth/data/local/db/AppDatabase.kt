package com.datalake.fieldauth.data.local.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import net.zetetic.database.sqlcipher.SupportOpenHelperFactory

@Database(
    entities = [EnrolledFaceEntity::class, AttendanceRecordEntity::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(DbConverters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun enrolledFaceDao(): EnrolledFaceDao
    abstract fun attendanceDao(): AttendanceDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context, databasePassphrase: ByteArray): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                // Configure SQLCipher encryption factory
                val factory = SupportOpenHelperFactory(databasePassphrase)

                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "datalake_secured_biometrics.db"
                ).openHelperFactory(factory) // Enforces SQLite database file encryption
                 .fallbackToDestructiveMigration()
                 .build()

                INSTANCE = instance
                instance
            }
        }
    }
}
