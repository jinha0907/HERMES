package com.example.hermes.util

object CategoryClassifier {
    fun classify(pkg: String): String {
        val name = pkg.lowercase()
        for ((category, keywords) in AppDictionary.categories) {
            if (keywords.any { name.contains(it) }) return category
        }
        return "etc"
    }
}