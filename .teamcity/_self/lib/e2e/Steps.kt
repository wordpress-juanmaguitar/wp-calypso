package _self.lib.e2e

import jetbrains.buildServer.configs.kotlin.v2019_2.BuildSteps
import jetbrains.buildServer.configs.kotlin.v2019_2.BuildStep
import jetbrains.buildServer.configs.kotlin.v2019_2.buildSteps.ScriptBuildStep
import jetbrains.buildServer.configs.kotlin.v2019_2.buildSteps.script

/**
 * Prepares the environment to run Playwright tests.
 *
 * This will generate a Script step that:
 *
 * - Updates node
 * - Set some env variables
 * - Installs dependencies for @automattic/calypso-e2e and builds it
 * - Installs dependencies for wp-e2e-tests
 *
 * It uses Yarn focus mode (https://yarnpkg.com/cli/workspaces/focus) to minimize the dependencies
 * installed and save some time. Yarn may throw some warnings about unused overrides, but they are safe to ignore.
 */
fun BuildSteps.prepareEnvironment(): ScriptBuildStep {
	return script {
		name = "Prepare environment"
		scriptContent = """
			#!/bin/bash
			# Update node
			. "${'$'}NVM_DIR/nvm.sh" --no-use
			nvm install
			set -o errexit
			set -o nounset
			set -o pipefail

			export NODE_ENV="test"
			export PLAYWRIGHT_BROWSERS_PATH=0

			# Install deps
			yarn workspaces focus wp-e2e-tests @automattic/calypso-e2e

			# Build packages
			yarn workspace @automattic/calypso-e2e build
		""".trimIndent()
		dockerImagePlatform = ScriptBuildStep.ImagePlatform.Linux
		dockerPull = true
		dockerImage = "%docker_image_e2e%"
		dockerRunParameters = "-u %env.UID%"
	}
}

/**
 * Collects the resulting artifacts from a test run.
 *
 * This function will collect the following:
 * 	- Screenshots
 *	- Logs
 *	- Trace files
 */
fun BuildSteps.collectResults(): ScriptBuildStep {
	return script {
		name = "Collect results"
		executionMode = BuildStep.ExecutionMode.RUN_ON_FAILURE
		scriptContent = """
			#!/bin/bash
			# Update node
			. "${'$'}NVM_DIR/nvm.sh" --no-use
			nvm install
			set -o errexit
			set -o nounset
			set -o pipefail
			set -x

			mkdir -p screenshots
			find test/e2e -type f -path '*/screenshots/*' -print0 | xargs -r -0 mv -t screenshots

			mkdir -p logs
			find test/e2e -name '*ß.log' -print0 | xargs -r -0 tar cvfz logs.tgz

			mkdir -p trace
			find test/e2e/results -name '*.zip' -print0 | xargs -r -0 mv -t trace
		""".trimIndent()
		dockerImage = "%docker_image_e2e%"
		dockerImagePlatform = ScriptBuildStep.ImagePlatform.Linux
		dockerRunParameters = "-u %env.UID%"
	}
}

/**
 *
 */
fun BuildSteps.runTests(
	stepName: String = "",
	dockerBuildNumber: String = "",
	testGroup: String = "",
	envVars: Map<String, String>
): ScriptBuildStep {
	return script {
		name = stepName
		dockerImage = "%docker_image_e2e%"

		val scriptContentBuilder = StringBuilder()

		scriptContentBuilder.append(
			"""
			# Configure bash shell.
			shopt -s globstar
			set -x

			# Set up artifact directory.
			cd test/e2e
			mkdir temp
			"""
		)

		println(scriptContentBuilder.toString())

		if (!dockerBuildNumber.isBlank()) {
			scriptContentBuilder.append(
				"""
				chmod +x ./bin/get-calypso-live-url.sh
				URL=${'$'}(./bin/get-calypso-live-url.sh $dockerBuildNumber)
				if [[ ${'$'}? -ne 0 ]]; then
					// Command failed. URL contains stderr
					echo ${'$'}URL
					exit 1
				fi
				"""
			)
		}

		println(scriptContentBuilder.toString())

		scriptContentBuilder.append(
			"""
			export NODE_CONFIG_ENV=test
			export PLAYWRIGHT_BROWSERS_PATH=0
			export TEAMCITY_VERSION=2021
			export DEBUG=pw:api
			export HEADLESS=false
			"""
		)

		println(scriptContentBuilder.toString())

		for ((key, value) in envVars) {
			scriptContentBuilder.append( "export $key=$value\n")
		}

		println(scriptContentBuilder.toString())

		scriptContentBuilder.append(
			"""
			# Decrypt config
			openssl aes-256-cbc -md sha1 -d -in ./config/encrypted.enc -out ./config/local-test.json -k "%CONFIG_E2E_ENCRYPTION_KEY%"

			xvfb-run yarn jest --reporters=jest-teamcity --reporters=default --maxWorkers=%E2E_WORKERS% --group=$testGroup
			"""
		)

		println(scriptContentBuilder.toString())

		scriptContent = scriptContentBuilder.toString().trimIndent()
	}
}
