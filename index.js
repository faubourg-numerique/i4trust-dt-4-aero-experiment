const iShareToolsForI4Trust = require("ishare-tools-for-i4trust");
const axios = require("axios").default;

require("dotenv").config({ path: __dirname + "/.env" });

const DELEGATION_REQUEST = {
    delegationRequest: {
        policyIssuer: process.env.LA_ISLA_IDENTIFIER,
        target: {
            accessSubject: process.env.AWR_IDENTIFIER
        },
        policySets: [
            {
                policies: [
                    {
                        target: {
                            resource: {
                                type: "RadioEquipmentMeasurement",
                                identifiers: [
                                    "*"
                                ],
                                attributes: [
                                    "*"
                                ]
                            },
                            actions: [
                                "GET"
                            ]
                        },
                        rules: [
                            {
                                effect: "Permit"
                            }
                        ]
                    }
                ]
            }
        ]
    }
};

async function main() {
    console.log("Generating iShare JWT...");

    var config = {
        issuer: process.env.AWR_IDENTIFIER,
        subject: process.env.AWR_IDENTIFIER,
        audience: process.env.LA_ISLA_IDENTIFIER,
        x5c: [process.env.AWR_X5C_1, process.env.AWR_X5C_2, process.env.AWR_X5C_3],
        privateKey: process.env.AWR_PRIVATE_KEY
    };

    const iShareJWT = iShareToolsForI4Trust.generateIShareJWT(config);

    console.log("OK\n");

    console.log("Requesting access token...");

    var config = {
        arTokenURL: process.env.LA_ISLA_AR_TOKEN_URL,
        clientId: process.env.AWR_IDENTIFIER,
        iShareJWT: iShareJWT
    };

    const accessToken = await iShareToolsForI4Trust.getAccessToken(config);

    console.log("OK\n");

    console.log("Requesting delegation token...");

    var config = {
        arDelegationURL: process.env.LA_ISLA_AR_DELEGATION_URL,
        delegationRequest: DELEGATION_REQUEST,
        accessToken: accessToken
    };

    const delegationToken = await iShareToolsForI4Trust.getDelegationToken(config);

    console.log("OK\n");

    console.log("Requesting context broker through api gateway...");

    var url = process.env.LA_ISLA_API_GATEWAY_URL + "/ngsi-ld/v1/entities?type=RadioEquipmentMeasurement"

    var config = {
        headers: {
            Authorization: `Bearer ${delegationToken}`
        }
    };

    var response = await axios.get(url, config);
    var entities = response.data;

    console.log("OK\n");

    console.log(entities);
}

main();
