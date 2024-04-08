const functions = require("firebase-functions");
const { PKPass } = require("passkit-generator");
const fs = require('fs');

function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return `rgb(${r}, ${g}, ${b})`;
}

exports.pass = functions.https.onRequest(async (request, response) => {
    try {
        const newPass = await PKPass.from({
            model: "./model/custom.pass",
            certificates: {
                wwdr: fs.readFileSync("./certs/wwdr.pem"),
                signerCert: fs.readFileSync("./certs/signerCert.pem"),
                signerKey: fs.readFileSync("./certs/signerKey.pem"),
                signerKeyPassphrase: "1234",
            },
        }, {
            authenticationToken: "21973y18723y12897g31289yge981y2gd89ygasdqsqdwq",
            webServiceURL: "http://127.0.0.1:5001/zeta-bonsai-410704/us-central1/pass",
            serialNumber: "PASS-213213",
            description: "test description pass",
            logoText: "logoText description",
            foregroundColor: hexToRgb("#" + request.body.textColor),
            backgroundColor: hexToRgb("#" + request.body.backgroundColor),
        });

        // Clear existing fields
        newPass.primaryFields = [];
        newPass.secondaryFields = [];
        newPass.auxiliaryFields = [];

        // Add primary field
        newPass.primaryFields.push({
            key: "primary",
            label: request.body.primary.label,
            value: request.body.primary.value,
        });

        // Add secondary fields
        request.body.secondary.forEach((field, index) => {
            newPass.secondaryFields.push({
                key: `secondary${index}`,
                label: field.label,
                value: field.value,
            });
        });

        // Add auxiliary fields
        request.body.auxiliary.forEach((field, index) => {
            newPass.auxiliaryFields.push({
                key: `auxiliary${index}`,
                label: field.label,
                value: field.value,
            });
        });

        // Set barcodes if needed
        // For example:
        // newPass.barcode = { format: "PKBarcodeFormatQR", message: "Your barcode message" };

        const bufferData = newPass.getAsBuffer();

        fs.writeFileSync("new.pkpass", bufferData);

        console.log("Pass was generated successfully");
        response.status(200).send({});
    } catch (error) {
        console.error("Error generating pass:", error);
        response.status(500).send({ error: "Failed to generate pass" });
    }
});
