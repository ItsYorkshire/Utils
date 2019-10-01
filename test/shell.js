"use strict";

describe("Shell-specific functions", () => {
	const utils = require("../index.js");
	const fs = require("fs");
	const path = require("path");

	describe("exec()", function(){
		const {exec, wait} = utils;
		this.slow(1000);

		it("executes external commands asynchronously", () =>
			expect(exec("true")).to.be.a("promise"));

		it("captures their standard output streams", async () =>
			expect(await exec("printf", ["<%03x>\\n", "255"]))
				.to.have.property("stdout")
				.that.is.a("string")
				.and.that.equals("<0ff>\n"));

		it("captures their standard error streams", async () =>
			expect(await exec("node", ["-e", 'process.stderr.write("Foo")']))
				.to.have.property("stderr")
				.that.is.a("string")
				.and.that.equals("Foo"));

		it("captures the command's exit code", async () =>
			expect(await exec("node", ["-e", "process.exit(3)"]))
				.to.have.property("code")
				.that.is.a("number")
				.and.that.equals(3));

		it("resolves with an object that includes each property", async () =>
			expect(await exec("node", ["-e", `
				process.stdout.write("ABC");
				process.stderr.write("XYZ");
				process.exit(1);
			`])).to.eql({
				stdout: "ABC",
				stderr: "XYZ",
				code: 1,
			}));

		it("always includes each property with the resolved object", async () => {
			expect(await exec("echo"))  .to.eql({stdout: "\n", stderr: "", code: 0});
			expect(await exec("true"))  .to.eql({stdout: "",   stderr: "", code: 0});
			expect(await exec("false")) .to.eql({stdout: "",   stderr: "", code: 1});
		});

		it("can pipe arbitrary data to standard input", async () =>
			expect(await exec("sed", ["-e", "s/in/out/"], "input\n")).to.eql({
				stdout: "output\n",
				stderr: "",
				code: 0,
			}));

		it("can pipe empty input without hanging process", () =>
			Promise.race([
				wait(750).then(() => Promise.reject()),
				exec("sed", ["-e", "s/A/B/g"], ""),
			]));

		describe("Encoding", () => {
			it("encodes streams as UTF-8 by default", async () => {
				const echo = ["-e", "process.stdin.on('data', bytes => process.stdout.write(bytes))"];
				expect((await exec("node", echo, "𒀻")).stdout).to.equal("𒀻");
			});
			
			it("allows default encodings to be overridden", async () => {
				const echo = ["-e", "process.stdout.write('foo')"];
				const result = await exec("node", echo, null, {encoding: "base64"});
				expect(result).to.eql({stdout: "Zm9v", stderr: "", code: 0});
			});
			
			it("allows per-stream encoding assignment", async () => {
				const echo = ["-e", "process.stdout.write('foo'); process.stderr.write('foo')"];
				expect(await exec("node", echo, null, {encoding: ["utf8", "utf8", "base64"]})).to.eql({
					stdout: "foo",
					stderr: "Zm9v",
					code: 0,
				});
				expect(await exec("node", echo, null, {encoding: ["utf8", "base64", "utf8"]})).to.eql({
					stdout: "Zm9v",
					stderr: "foo",
					code: 0,
				});
			});
			
			it("treats strings as shorthand for `{encoding: …}`", async () => {
				const echo = ["-e", "process.stdout.write('foo'); process.stderr.write('foo')"];
				expect(await exec("node", echo, null, "base64")).to.eql({stdout: "Zm9v", stderr: "Zm9v", code: 0});
			});
			
			it("uses UTF-8 for missing encoding entries", async () => {
				const echo = ["-e", "process.stdout.write('foo'); process.stderr.write('foo')"];
				expect(await exec("node", echo, null, {encoding: ["utf8", "", "base64"]})).to.eql({
					stdout: "foo",
					stderr: "Zm9v",
					code: 0,
				});
				expect(await exec("node", echo, null, {encoding: ["utf8", "base64"]})).to.eql({
					stdout: "Zm9v",
					stderr: "foo",
					code: 0,
				});
			});
		});

		describe("Redirection", function(){
			this.slow(5000);
			const tempFile = require("path").join(__dirname, "fixtures", "temp.log");
			after("Removing temporary file", () => fs.unlinkSync(tempFile));
			
			it("can write standard output to a file", async () => {
				await exec("node", ["-e", "process.stdout.write('Foo\\nBar')"], null, {outputPath: tempFile});
				expect(fs.existsSync(tempFile)).to.be.true;
				expect(fs.readFileSync(tempFile, "utf8")).to.equal("Foo\nBar");
			});
			
			it("replaces a file's existing content", async () => {
				await exec("node", ["-e", "process.stdout.write('Foo\\n')"], null, {outputPath: tempFile});
				expect(fs.existsSync(tempFile)).to.be.true;
				expect(fs.readFileSync(tempFile, "utf8")).to.equal("Foo\n");
				await exec("node", ["-e", "process.stdout.write('Bar')"], null, {outputPath: tempFile});
				expect(fs.readFileSync(tempFile, "utf8")).to.equal("Bar");
			});
			
			it("respects the stream's encoding", async () => {
				const data = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAIBTAA7";
				const emit = ["-e", `process.stdout.write(Buffer.from("${data}", "base64"))`];
				await exec("node", emit, null, {outputPath: tempFile, encoding: "binary"});
				expect(fs.readFileSync(tempFile)).to.eql(Buffer.from(data, "base64"));
			});
		});
	
		describe("Environment", () => {
			const echoEnv = ["-e", "process.stdout.write(JSON.stringify(process.env))"];
			const randomKey = "foo" + Date.now() + Math.random(1e10).toString(16);
			
			it("makes the caller's environment visible to the subprocess", async () =>
				expect(JSON.parse((await exec("node", echoEnv)).stdout)).to.eql(process.env));
			
			it("allows new environment variables to be added", async () => {
				const {stdout} = await exec("node", echoEnv, null, {env: {[randomKey]: "A"}});
				expect(JSON.parse(stdout)).to.have.property(randomKey).which.equals("A");
			});
			
			it("does not replace the existing environment", async () => {
				const {stdout} = await exec("node", echoEnv, null, {env: {[randomKey]: "B"}});
				expect(JSON.parse(stdout)).to.include(process.env);
			});
			
			it("overwrites existing variables of the same name", async () => {
				process.env[randomKey] = "C";
				const {stdout} = await exec("node", echoEnv, null, {env: {[randomKey]: "D"}});
				expect(JSON.parse(stdout)).to.have.property(randomKey).which.equals("D");
				delete process.env[randomKey];
			});
		});

		describe("Working directory", () => {
			const echoCwd = ["-e", "process.stdout.write(process.cwd())"];
			
			let cwd = "";
			afterEach(() => cwd && process.chdir(cwd));
			beforeEach(() => { cwd = process.cwd(); process.chdir(__dirname); });
			
			it("defaults to the parent process's working directory", async () => {
				const {stdout} = await exec("node", echoCwd);
				expect(stdout).to.equal(__dirname);
			});
			
			it("can change the subprocess's working directory", async () => {
				const {join} = require("path");
				cwd = join(__dirname, "fixtures");
				const {stdout} = await exec("node", echoCwd, null, {cwd});
				expect(stdout).to.equal(join(__dirname, "fixtures"));
			});
		});
	});

	describe("execChain()", function(){
		const {execChain} = utils;
		this.slow(1000);
		
		it("executes a pipeline of external commands", async () =>
			expect(await execChain([
				["printf", "%s\\n", "foo"],
				["sed", "s/foo/bar/"],
				["tr", "a-z", "A-Z"],
			])).to.eql({code: 0, stdout: "BAR\n", stderr: ""}));
		
		it("executes pipelines asynchronously", async () =>
			expect(execChain([["true"]])).to.be.a("promise"));
		
		it("avoids modifying the original command list", async () => {
			const cmds = [["echo", "Foo"], ["grep", "Foo"]];
			const copy = JSON.parse(JSON.stringify(cmds));
			await execChain(cmds);
			expect(cmds).to.eql(copy);
		});
		
		it("returns the exit status of the last command", async () => {
			expect(await execChain([["true"], ["false"]])).to.eql({stdout: "", stderr: "", code: 1});
			expect(await execChain([["false"], ["true"]])).to.eql({stdout: "", stderr: "", code: 0});
		});
		
		it("concatenates each command's stderr stream", async () =>
			expect(await execChain([
				["node", "-e", 'console.log("ABC"); console.warn("123")'],
				["node", "-e", 'console.log("XYZ"); console.warn("456")'],
			])).to.eql({
				code: 0,
				stderr: "123\n456\n",
				stdout: "XYZ\n",
			}));
		
		it("can pipe input to the first command", async () =>
			expect(await execChain([["sed", "s/foo/bar/"]], "<foo>")).to.eql({
				code: 0,
				stderr: "",
				stdout: "<bar>\n",
			}));
		
		it("can write the last command's output to a file", async () => {
			const fs = require("fs");
			const tmp = require("path").join(__dirname, "fixtures", "temp.log");
			fs.existsSync(tmp) && fs.unlinkSync(tmp);
			expect(await execChain([
				["node", "-e", "console.warn(123); console.log(456)"],
				["sed", "s/456/bar/"],
			], null, {outputPath: tmp})).to.eql({
				code: 0,
				stderr: "123\n",
				stdout: "",
			});
			expect(fs.readFileSync(tmp, "utf8")).to.equal("bar\n");
			fs.unlinkSync(tmp);
		});
	});

	describe("execString()", () => {
		const {execString:$} = utils;
		
		it("executes ordinary arguments", async () =>
			expect(await $("echo Foo")).to.eql("Foo\n"));

		it("joins multiple arguments together before executing", async () =>
			expect(await $("echo", "Foo", "Bar")).to.eql("Foo Bar\n"));

		it("executes tagged template literals", async () =>
			expect(await $ `echo Foo Bar`).to.eql("Foo Bar\n"));

		it("executes tagged templates with interpolation", async () => {
			expect(await $ `echo Foo ${2 + 4} Baz`).to.eql("Foo 6 Baz\n");
			expect(await $ `echo F${2}o Bar ${"Baz"}`).to.eql("F2o Bar Baz\n");
			expect(await $ `${"echo"} Foo`).to.eql("Foo\n");
		});

		it("executes multiple commands", async () =>
			expect(await $ `echo Foo; echo Bar;`).to.eql("Foo\nBar\n"));

		it("executes piped commands", async () =>
			expect(await $ `echo Foo | sed s/Foo/Bar/ | tr B b`).to.eql("bar\n"));

		it("stores stdout and stderr on thrown error objects", async () => {
			let error = null;
			try      { await $ `echo Foo; echo >&2 Bar; false`; }
			catch(e) { error = e; }
			expect(error).to.be.an.instanceOf(Error);
			expect(error).to.have.property("stdout", "Foo\n");
			expect(error).to.have.property("stderr", "Bar\n");
		});
	});
	
	describe("findFiles()", () => {
		const {findFiles} = utils;
		const gitDir = path.join(__dirname, "fixtures", ".git");
		const npmDir = path.join(__dirname, "fixtures", "node_modules");
		const stripTimes = stats => Object.fromEntries(
			Object.entries(stats).filter(key => /time(?:Ms)?$/i.test(key)));

		let tests, files;
		before("Preparing directory listings", async () => {
			tests = fs.readdirSync(__dirname).map(name => path.join(__dirname, name));
			files = await findFiles(__dirname);
			fs.existsSync(gitDir) || fs.mkdirSync(gitDir);
			fs.existsSync(npmDir) || fs.mkdirSync(npmDir);
		});
		
		after("Removing fixtures", () => {
			fs.rmdirSync(gitDir);
			fs.rmdirSync(npmDir);
		});
		
		it("returns a map of resolved filepaths", () => {
			expect(files).to.be.an.instanceOf(Map);
			expect(files.size).to.be.at.least(3);
			const keys = [...files.keys()];
			expect(keys.every(key => path.isAbsolute(key))).to.be.true;
			expect(keys).to.include(__filename);
		});
		
		it("maps each path to an `fs.Stats` instance", () => {
			const values = [...files.values()];
			expect(values).to.have.lengthOf(files.size);
			expect(values.every(value => value instanceof fs.Stats)).to.be.true;
			for(const [key, value] of files)
				expect(value).to.include(stripTimes(fs.lstatSync(key)));
		});
		
		it("maps paths absolutely", async () => {
			expect([...(await findFiles(".")) .keys()].every(key => path.isAbsolute(key))).to.be.true;
			expect([...(await findFiles("./")).keys()].every(key => path.isAbsolute(key))).to.be.true;
		});
		
		it("includes files", () => {
			expect(files).to.include.keys(...tests);
			for(const testFile of tests){
				expect(files).to.include.key(testFile);
				expect(files.get(testFile)).to.be.an.instanceOf(fs.Stats);
			}
		});
		
		it("includes directories", () => {
			const fixtures = path.join(__dirname, "fixtures");
			const dirStats = stripTimes(fs.lstatSync(fixtures));
			expect(files).to.include.key(fixtures);
			expect(files.get(fixtures)).to.be.an.instanceOf(fs.Stats).and.include(dirStats);
		});
		
		it("includes them recursively", async () => {
			const fixtures = [
				"fixtures/base64/rgba.html",
				"fixtures/base64/rgba.json",
				"fixtures/colours",
				"fixtures/colours/cmyk-tests.js",
				"fixtures/colours/hsl-tests.js",
				"fixtures/colours/hsv-tests.js",
				"fixtures/colours/mixed-tests.js",
				"fixtures/rgba",
				"fixtures/which",
			].map(str => path.join(__dirname, ...str.split(/[\\/]/)));
			expect(files).to.include.keys(...fixtures);
			expect(await findFiles(path.resolve(__dirname, ".."))).to.include.keys(...fixtures);
		});
		
		it("excludes the original search directory", () =>
			expect([...files.keys()]).not.to.include(__dirname));
		
		describe("Options", () => {
			describe(".ignore", () => {
				it("excludes `.git` and `node_modules` by default", () =>
					expect(files).not.to.include.keys(gitDir.toUpperCase(), npmDir));
				
				it("excludes paths using regular expressions", async () => {
					const files = [...(await findFiles(__dirname, {ignore: /base64/})).keys()];
					expect(files).not.to.include(path.join(__dirname, "fixtures", "base64"));
					expect(files).not.to.include(path.join(__dirname, "fixtures", "base64", "rgba.html"));
					expect(files).not.to.include(path.join(__dirname, "fixtures", "base64", "rgba.json"));
					expect(files).to.include(gitDir);
					expect(files).to.include(npmDir);
				});
				
				it("excludes paths using callback functions", async () => {
					const jsonFile = path.join(__dirname, "fixtures", "base64", "rgba.json");
					const htmlFile = path.join(__dirname, "fixtures", "base64", "rgba.html");
					let files = [...(await findFiles(__dirname, {ignore: path => path === jsonFile})).keys()];
					expect(files).not.to.include(jsonFile);
					expect(files).to.include(htmlFile);
					expect(files).to.include(gitDir);
					expect(files).to.include(npmDir);
					files = [...(await findFiles(__dirname, {ignore: (path, stats) => stats.isFile()})).values()];
					expect(files.every(value => value.isDirectory())).to.be.true;
				});
				
				it("doesn't recurse into excluded directories", async () => {
					const fixtures = path.join(__dirname, "fixtures");
					const calledOn = [];
					await findFiles(__dirname, {ignore: path => {
						calledOn.push(path);
						return path === fixtures;
					}});
					expect(calledOn).to.include(fixtures);
					expect(calledOn).not.to.include(path.join(fixtures, "base64"));
				});
			});
			
			describe(".match", () => {
				it("restricts matches using regular expressions", async () => {
					const files = await findFiles(__dirname, {match: /[\\/](?:fixtures|base64|rgba)$/});
					expect(files.size).to.equal(3);
					expect([...files.keys()]).to.eql([
						path.join(__dirname, "fixtures"),
						path.join(__dirname, "fixtures", "base64"),
						path.join(__dirname, "fixtures", "rgba"),
					]);
				});
				
				it("restricts matches using callback functions", async () => {
					const statsList = [];
					const whitelist = [
						"fixtures",
						"fixtures/base64",
						"fixtures/base64/rgba.html",
					].map(dir => path.join(__dirname, ...dir.split(/[\\/]/)));
					const files = await findFiles(__dirname, {match: (path, stats) => {
						statsList.push(stats);
						return whitelist.includes(path);
					}});
					expect(files.size).to.equal(3);
					expect([...files.keys()]).to.eql(whitelist);
					expect(statsList.every(x => x instanceof fs.Stats)).to.be.true;
				});
				
				it("filters results before `.ignore` is used", async () => {
					expect((await findFiles(__dirname, {match: /\.git$/}))).to.eql(new Map());
					const files = await findFiles(__dirname, {match: /(?:fixtures|\.git)$/, ignore: /(?=A)Z/});
					expect(files.size).to.equal(2);
					expect([...files.keys()]).to.eql([path.join(__dirname, "fixtures"), gitDir]);
					const calledOn = [];
					await findFiles(__dirname, {match: path => !!calledOn.push(path)});
					expect(calledOn).to.include(path.join(__dirname, "fixtures", ".git"));
					expect(calledOn).to.include(path.join(__dirname, "fixtures", "node_modules"));
				});
			});
		
			describe(".maxDepth", () => {
				it("limits how many directories are descended through", async () => {
					const fixturePath = path.join(__dirname, "fixtures");
					const fixtureDirs = fs.readdirSync(fixturePath)
						.filter(name => name !== ".git" && name !== "node_modules")
						.map(name => path.join(fixturePath, name));
					expect([...(await findFiles(__dirname, {maxDepth: 1})).keys()]).to.eql([...tests, ...fixtureDirs]);
					expect([...(await findFiles(__dirname, {maxDepth: 0})).keys()]).to.eql([...tests]);
				});
				
				it("enforces no limit if set to a negative/invalid number", async () => {
					const keys = [...files.keys()];
					expect([...(await findFiles(__dirname, {maxDepth: -2}))   .keys()]).to.eql(keys);
					expect([...(await findFiles(__dirname, {maxDepth: NaN}))  .keys()]).to.eql(keys);
					expect([...(await findFiles(__dirname, {maxDepth: "Foo"})).keys()]).to.eql(keys);
				});
				
				it("ignores the decimal component of floating-point values", async () => {
					expect([...(await findFiles(__dirname, {maxDepth: +0.75})).keys()]).to.eql(tests);
					expect([...(await findFiles(__dirname, {maxDepth: -0.25})).keys()]).to.eql(tests);
				});
			});
		});
	});

	describe("which()", () => {
		const {which} = utils;
		const pathKey = "win32" === process.platform ? "Path" : "PATH";
		const fixtures = path.join(__dirname, "fixtures", "which");
		const tmpClean = () => fs.readdirSync(fixtures).forEach(file =>
			/^tmp\./i.test(file) && fs.unlinkSync(path.join(fixtures, file)));
		
		let env, firstNode = "";
		before(() => tmpClean(env = process.env));
		after(() => tmpClean(process.env = env));
		beforeEach(() => process.env = {...env});

		it("returns the path of the first matching executable", async () => {
			expect(firstNode = await which("node")).to.not.be.empty;
			expect(fs.statSync(firstNode).isFile()).to.be.true;
		});
		
		it("returns every matching path if the `all` parameter is set", async () => {
			const result = await which("node", true);
			expect(result).to.be.an("array");
			expect(result[0]).to.be.a("string").and.to.equal(firstNode);
			process.env[pathKey] = fixtures + path.delimiter + process.env[pathKey];
			const nodeExe = "win32" === process.platform ? "node.exe" : "node";
			expect(await which("node", true)).to.eql([path.join(fixtures, nodeExe), ...result]);
		});

		it("returns an empty value if nothing was matched", async () => {
			expect(await which("wegfjekrwg")).to.equal("");
			expect(await which("wegfjekrwg", true)).to.be.an("array").with.lengthOf(0);
		});
		
		it("locates programs with names containing whitespace", async () => {
			process.env[pathKey] = fixtures;
			"win32" === process.platform
				? expect(await which("APP DATA")).to.equal(path.join(fixtures, "APP DATA.bat"))
				: expect(await which("foo bar")).to.equal(path.join(fixtures, "foo bar"));
		});

		it("doesn't break when passed empty input", async () => {
			expect(await which(""))          .to.equal("");
			expect(await which())            .to.equal("");
			expect(await which(null))        .to.equal("");
			expect(await which(false))       .to.equal("");
			expect(await which("",    true)) .to.eql([]);
			expect(await which(null,  true)) .to.eql([]);
			expect(await which(false, true)) .to.eql([]);
		});
		
		it("doesn't break if $PATH is empty", async () => {
			// HACK: CMD.EXE resolves variable-names case-insensitively
			for(const key in process.env)
				if(/^PATH(?:EXT)?$/i.test(key))
					delete process.env[key];
			expect(await which("node"))       .to.equal("");
			expect(await which("node", true)) .to.eql([]);
		});
		
		// Windows-specific specs
		"win32" === process.platform && describe("Windows-specific", () => {
			beforeEach(() => process.env = {...env, Path: fixtures});
			before(async () => {
				process.env.Path    = __dirname;
				process.env.PATHEXT = ".COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.WSF;.WSH;.MSC";
				expect(await which("bar"))       .to.equal("");
				expect(await which("tmp.1.foo")) .to.equal("");
				expect(await which("tmp.2.foo")) .to.equal("");
			});
			
			it("tests %PATHEXT% case-insensitively", async () => {
				process.env.Path    = fixtures + path.delimiter + __dirname;
				process.env.PATHEXT += ";.FOO";
				fs.writeFileSync(path.join(fixtures, "tmp.1.foo"), "");
				fs.writeFileSync(path.join(fixtures, "tmp.2.FOO"), "");
				expect(await which("bar"))   .to.equal(path.join(fixtures, "bar.foo"));
				expect(await which("tmp.1")) .to.equal(path.join(fixtures, "tmp.1.foo"));
				expect(await which("tmp.2")) .to.equal(path.join(fixtures, "tmp.2.foo"));
			});
			
			it('defaults to ".COM;.EXE;.BAT" if %PATHEXT% is unset', async () => {
				process.env.PATHEXT = "";
				for(const ext of "vbs vbe js wsf wsh msc".split(" ")){
					fs.writeFileSync(path.join(fixtures, "tmp." + ext), "");
					expect(await which("tmp"))       .to.equal("");
					expect(await which("tmp", true)) .to.eql([]);
				}
				const batFile = path.join(fixtures, "tmp.bat");
				fs.writeFileSync(batFile, "");
				expect(await which("tmp"))       .to.equal(batFile);
				expect(await which("tmp", true)) .to.eql([batFile]);
				
				const exeFile = path.join(fixtures, "tmp.exe");
				fs.writeFileSync(exeFile, "");
				expect(await which("tmp"))       .to.equal(exeFile);
				expect(await which("tmp", true)) .to.eql([exeFile, batFile]);
				
				const comFile = path.join(fixtures, "tmp.com");
				fs.writeFileSync(comFile, "");
				expect(await which("tmp"))       .to.equal(comFile);
				expect(await which("tmp", true)) .to.eql([comFile, exeFile, batFile]);
			});
			
			it("doesn't interpolate variables", async () => {
				expect(await which("%APPDATA%")) .to.equal(path.join(fixtures, "%APPDATA%.bat"));
				expect(await which("%APPDATA%")) .to.equal(path.join(fixtures, "%APPDATA%.bat"));
				expect(await which("%DATE%"))    .to.equal(path.join(fixtures, "%DATE%.bat"));
				expect(await which("%EMPTY%"))   .to.equal("");
				expect(await which("%EMPTY"))    .to.equal("");
			});
			
			it("doesn't split on delimiters", async () =>
				expect(await which("APP;DATA")).to.equal(path.join(fixtures, "APP;DATA.bat")));
			
			it("treats escape sequences literally", async () => {
				expect(await which("^%APPDATA%"))   .to.equal(path.join(fixtures, "^%APPDATA%.bat"));
				expect(await which("^%APPDATA^^%")) .to.equal(path.join(fixtures, "^%APPDATA^^%.bat"));
				expect(await which("%APP DATA%"))   .to.equal(path.join(fixtures, "%APP DATA%.bat"));
			});
		});
	});
});
