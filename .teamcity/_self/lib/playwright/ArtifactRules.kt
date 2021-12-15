package _self.lib.playwright

import jetbrains.buildServer.configs.kotlin.v2019_2.BuildType

/**
 *
 */
fun BuildType.artifactRules(): String {
	return """
		logs.tgz => logs.tgz
		screenshots => screenshots
		trace => trace
	""".trimIndent()
}
