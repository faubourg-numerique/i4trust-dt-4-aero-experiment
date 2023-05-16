const entityId = "urn:ngsi-ld:RadioEquipmentMeasurement:46ea24d3-ca70-4155-a1c7-6aed8aa39d06";
const contextUrl = "https://datamodels.ouranos-ws.com/la-isla/31/context.jsonld";

const iShareToolsForI4Trust = require("ishare-tools-for-i4trust");
const axios = require("axios").default;
const path = require("path");

require("dotenv").config({ path: [__dirname, ".env"].join(path.sep) });

async function main() {
    let config, date, url, data, accessToken;

    console.log("Generating iShare JWT...");

    config = {
        issuer: process.env.AWR_IDENTIFIER,
        subject: process.env.AWR_IDENTIFIER,
        audience: process.env.LA_ISLA_IDENTIFIER,
        x5c: [process.env.AWR_X5C_1, process.env.AWR_X5C_2, process.env.AWR_X5C_3],
        privateKey: process.env.AWR_PRIVATE_KEY
    };

    const iShareJWT = iShareToolsForI4Trust.generateIShareJWT(config);

    console.log("OK\n");

    console.log("Requesting access token...");

    config = {
        arTokenURL: process.env.LA_ISLA_AR_TOKEN_URL,
        clientId: process.env.AWR_IDENTIFIER,
        iShareJWT: iShareJWT
    };

    try {
        accessToken = await iShareToolsForI4Trust.getAccessToken(config);
    } catch (error) {
        console.log("Failed\n");
        return;
    }

    console.log("OK\n");

    console.log("Requesting context broker through api gateway...");

    date = new Date();

    url = `${process.env.LA_ISLA_API_GATEWAY_URL}/ngsi-ld/v1/entities/${entityId}/attrs`

    config = {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            Link: `<${contextUrl}>`
        }
    };

    data = {
        fwdPower: {
            observedAt: date.toISOString(),
            type: "Property",
            fwdPowerUnit: {
                type: "Property",
                value: "TEST"
            },
            value: 30
        }
    };

    try {
        await axios.patch(url, data, config);
    } catch (error) {
        console.log("Failed\n");
        return;
    }

    console.log("OK\n");
}

main();
