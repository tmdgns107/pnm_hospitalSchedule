import { APIGatewayProxyEvent, APIGatewayProxyResultV2, Handler } from 'aws-lambda';
import mysql from 'mysql2/promise';
import * as util from "./util";

export const handler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2> => {
    console.log("Event", event);

    let alias: string = 'dev';
    let tableName: string = 'hospital_test';

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
            const id = hospital.id;

            /** 기존에 병원데이터가 존재하는지 여부 확인 **/
            let searchQuery: string = `SELECT * FROM ${tableName} WHERE id = ?`
            const existingHospital = await util.queryMySQL(connection, searchQuery, [hospital.id]);
            console.log(`existingHospital ${hospital.id} result: ${existingHospital}`);

            if(existingHospital){
                /** 이미 병원이 존재한다면 데이터를 업데이트 진행 **/
                const updateQuery: string =
                    `UPDATE ${tableName} SET 
                        sidoNm = ?, sigunNm = ?, bizPlcNm = ?, roadNmAddr = ?, 
                        lotNoAddr = ?, zipCode = ?, lat = ?, lng = ?, status = ?, 
                        telNo = ?, updateTime = ? 
                    WHERE 
                        id = ?`;

                delete hospital.createTime;
                delete hospital.id;
                await util.queryMySQL(connection, updateQuery, [...hospital.values, id]);

                console.log(`A new row has been updated. id: ${id}`);
            }else{
                /** 이미 병원이 존재하지 않는다면 데이터를 삽입 진행 **/
                let insertQuery: string =
                    `INSERT INTO ${tableName} 
                    (id, sidoNm, sigunNm, bizPlcNm, roadNmAddr, lotNoAddr, zipCode, lat, lng, status, telNo, createTime, updateTime) 
                VALUES 
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                await util.queryMySQL(connection, insertQuery, hospital.values);

                console.log(`A new row has been inserted. id: ${id}`);
            }
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
