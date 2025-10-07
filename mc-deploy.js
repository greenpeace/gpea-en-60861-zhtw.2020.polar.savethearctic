const fs = require('fs');
const path = require('path');
const os = require('os');
const packageJson = require('./package.json');
//const FTPS = require('ftps');

/**
 * This file is a temporary script to replace gpea-npm-en-uploader
 * since we are migrating to mc. It's not fully automated. It still need
 * some manually work.
 *
 * What it does:
 *
 * 1. Replace the MC form with its server side format.
 * 2. Append the server side logic at the frontend of html file.
 * 3. Replace the versiob with timestamps. ex v=123 to v=12325345346
 * 4. Upload the asset to FTP.
 *
 *
 * Usage:
 *
 * at this line to your package.json
 * ```
 * "deploy-mc": "yarn run build:en && node mc-deploy.js"
 * ```
 *
 * and run `yarn deploy-mc` in your terminal.
 *
 *
 * NOTE!!! After the script ends, you HAVE TO MANUALLY copy/past the build/index.html
 * file into your marketing cloud editor.
 */


// definitions
let buildFolder = path.join(__dirname, "build"),
	EndpointURL = "https://web-api.gpeastasia.org/api/tw/petition/websign-proxy",
	CampaignId = "7012u000000OulhAAC",
	DonationPageUrl = "https://www.greenpeace.org/eastasia/", // not used now
	interests = ["Arctic"], // Arctic, Climate, Forest, Health, Oceans, Plastics
	ftpConfigName = "ftp_tw", // refer to ~/.npm-en-uploader-secret
	ftpRemoteDir = "/htdocs/migrate/petition/zh-TW.2020.polar.savethearctic.mc"

let indexHtmlFilePath = path.join(buildFolder, "index.html")
let fbuf = fs.readFileSync(indexHtmlFilePath)
let content = fbuf.toString()

// copied from https://github.com/greenpeace/gpea-npm-en-uploader/blob/master/upload_folder.js
/**
 * Use lftp to sync local dir to remote
 *
 * @param  {object} settings
 * @param  {string} localDir Local folder to update
 * @param  {string} remoteDir The remote path to upload. If it's not exist, it will be created.
 */
const upload_folder = function (settings, localDir) {
	// @see https://github.com/Atinux/node-ftps for arguments
	var ftps = new FTPS(settings);

	console.info(`Sync from \`${localDir}\` to \`${settings.protocol}://${settings.username}@${settings.host}:${settings.remoteDir}\``)

	return ftps.mirror({
			localDir: localDir,
			remoteDir: settings.remoteDir,
			upload: true
		})
		.cd(settings.remoteDir)
		.ls()
		.exec(function (err, res) {
			// err will be null (to respect async convention)
			// res is an hash with { error: stderr || null, data: stdout }
			if (err) {
				console.error(err)
			} else {
				console.info("Successfully uploaded.")
				console.info(res.data)
			}
		});
}

// patch form contents
let formTmpl =
	`<form method="post" action="${EndpointURL}" class="" id="mc-form">
		<input placeholder="FirstName" name="FirstName" type="text" value="">
		<input placeholder="LastName" name="LastName" type="text" value="">
		<input placeholder="Email" name="Email" type="email" value="">
		<input placeholder="MobileCountryCode" name="MobileCountryCode" type="text" value="886">
		<input placeholder="MobilePhone" name="MobilePhone" type="tel" value="">
		<input placeholder="Birthdate" name="Birthdate" type="text" value="">
		<input placeholder="OptIn" name="OptIn" type="checkbox" value="">

		<input type="hidden" name="req" value="post_data">
		<input type="hidden" name="LeadSource" value="">
		<input type="hidden" name="Petition_Interested_In_Arctic__c" value="true">
		<input type="hidden" name="Petition_Interested_In_Climate__c" value="false">
		<input type="hidden" name="Petition_Interested_In_Forest__c" value="false">
		<input type="hidden" name="Petition_Interested_In_Health__c" value="false">
		<input type="hidden" name="Petition_Interested_In_Oceans__c" value="false">
		<input type="hidden" name="Petition_Interested_In_Plastics__c" value="false">
		<input type="hidden" name="CampaignId" value="${CampaignId}">
		<input type="hidden" name="UtmMedium" value="">
		<input type="hidden" name="UtmSource" value="">
		<input type="hidden" name="UtmCampaign" value="">
		<input type="hidden" name="UtmContent" value="">
		<input type="hidden" name="UtmTerm" value="">
		<input type="hidden" name="DonationPageUrl" value="">
		<input name="req" type="hidden" value="post_data">

		<input type="hidden" name="numSignupTarget" value="">
		<input type="hidden" name="numResponses" value="">
	</form>
`


let matches = content.match(/(<form[^<]+mc-form(.|[\r\n])*form>)/)

if (matches) {
	let tokens = content.split(matches[1])

	if (tokens.length==2) {
		header = tokens[0]
		footer = tokens[1]

		content = tokens[0] + formTmpl + tokens[1]
		console.log('Content form patched')
	} else {
		throw new Error("Found multi MC form parts")
	}
} else {
	throw new Error("Cannot resolve the MC form from the index.html file")
}

// append the headers
let headersTmpl =``

content = headersTmpl + "\n" + content
content = content.replace(/%PUBLIC_URL%/g, packageJson.homepage);
console.log('PUBLIC_URL patched');
console.log('MC header patched')

// patch version numbers
content = content.replace(/v=\d+/g, "v="+(new Date).getTime())
console.log('version number patched')

// output to the file
fs.writeFileSync(indexHtmlFilePath, content)
// fs.writeFileSync("/Users/upchen/Dropbox/WorkingSpace/greenpeace/codes/mc/zhtw.2020.polar.savethearctic-content.html", content)
console.log('content patched')

// upload the folder to FTP
/*
let raw = fs.readFileSync(path.join(os.homedir(), ".npm-en-uploader-secret"));
let secrets = JSON.parse(raw);

let ftpSetting = secrets[ftpConfigName]
ftpSetting["remoteDir"] = ftpRemoteDir
upload_folder(ftpSetting, buildFolder)*/
