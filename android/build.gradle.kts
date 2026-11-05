plugins {
    id("com.android.application") version "8.7.3" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.21" apply false
    // KSP: genera el codigo de Room a partir de las anotaciones (@Entity, @Dao, @Database)
    id("com.google.devtools.ksp") version "2.0.21-1.0.28" apply false
}
