import { APIGatewayProxyEvent, APIGatewayProxyResultV2, Handler } from 'aws-lambda';
import mysql from 'mysql2/promise';
import * as util from "./util";

export const handler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2> => {
    console.log("Event", event);

    let alias: string = 'dev';
    let tableName: string = 'hospital_test';
    if(event.requestContext.path.includes('/prod/') || event.requestContext.path.includes('/live/')) {
        alias = 'prod';
        tableName = 'hospital';
    }

    let response: APIGatewayProxyResultV2 = {
        statusCode: 200,
        body: ''
    };
    let responseBody: { message: string; } ={
        message: '',
    };

    let connection;
    try {
        /** MySQL 연결 **/
        connection = await mysql.createConnection({
            host: process.env[`${alias.toUpperCase()}_DB_HOST`],
            user: process.env[`${alias.toUpperCase()}_DB_USER`],
            password: process.env[`${alias.toUpperCase()}_DB_PASSWORD`],
            port: 3306,
            database: process.env[`${alias.toUpperCase()}_DB_NAME`]
        });

        /** 공공데이터 API 동물병원 조회 **/
        let hospitals: any[] = await util.callPublicAPI();
        /** 공공데이터 결과를 DB 포맷에 맞게 변경 **/
        const filteredHospitals: any[] = util.filterHospitals(hospitals);

        console.log("filteredHospitals count", filteredHospitals.length);
        console.log("filteredHospitals", filteredHospitals);

        /** 공공데이터를 hospital 테이블에 입력 **/
        for(let hospital of filteredHospitals){
            let insertQuery: string =
                `INSERT INTO ${tableName} 
                    (id, sidoNm, sigunNm, bizPlcNm, roadNmAddr, lotNoAddr, zipCode, lat, lng, status, telNo, updateTime) 
                VALUES 
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            await util.queryMySQL(connection, insertQuery, hospital.values);
        }

        await util.sleep(100);
        response.statusCode = 200;
        responseBody.message = 'The veterinary hospital information update has been completed.';
        response.body = JSON.stringify(responseBody);
        return response;
    } catch (e) {
        console.log("Error in db connection", e);
        response.statusCode = 400;
        responseBody.message = 'An error occurred while executing the query.';
        response.body = JSON.stringify(responseBody);
        return response;
    } finally {
        if (connection) {
            connection.end();
        }
    }
};
