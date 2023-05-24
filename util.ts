import axios from 'axios';

const crypto = require('crypto');

/** DB 조회 **/
export async function queryMySQL(connection: any, query: string, values: any): Promise<any> {
    try {
        const [rows] = await connection.execute(query, values);
        return rows;
    } catch (error) {
        throw error;
    }
}

/** 경기도 공공데이터 API 호출 **/
export async function callPublicAPI(): Promise<any[]>{
    try{
        const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY;
        const pageSize: number = 1000;
        let array: any[] = [];
        for(let pageIndex: number = 1; pageIndex <= 10; pageIndex++){
            const url: string = `https://openapi.gg.go.kr/Animalhosptl?key=${PUBLIC_API_KEY}&type=json&pSize=${pageSize}&pIndex=${pageIndex}`;
            let config: object = {
                maxBodyLength: Infinity,
                headers: {}
            };
            console.log("config", config);

            let results = await axios.get(url, config);
            console.log("results", results);

            if(!results.data || (results.data && !results.data.Animalhosptl)){
                console.log("Data not exist");
                continue;
            }

            const listTotalCount = results.data.Animalhosptl[0].head[0].list_total_count;
            array = [...array, ...results.data.Animalhosptl[1].row];

            if(array.length >= listTotalCount){
                console.log("Search finished", pageIndex);
                break;
            }
        }

        return array;
    }catch (e) {
        console.log("Error in callVisionAPI", e);
        return [];
    }
}

export function filterHospitals(hospitals: any[]): any[] {
    try{
        const updateTime: string = new Date().toISOString();
        return hospitals.filter(item => {
            if (!item.BSN_STATE_NM.includes('폐업'))
                return item;
        }).map(item => ({
            id: crypto.pbkdf2Sync(item.REFINE_ROADNM_ADDR, process.env.SHA256_SALT, 1, 8, 'sha256').toString('hex'),
            sidoNm: '경기도',
            sigunNm: item.SIGUN_NM,
            bizPlcNm: item.BIZPLC_NM,
            roadNmAddr: item.REFINE_ROADNM_ADDR,
            lotNoAddr: item.REFINE_LOTNO_ADDR,
            zipCode: String(item.REFINE_ZIPNO),
            lat: item.REFINE_WGS84_LAT,
            lng: item.REFINE_WGS84_LOGT,
            status: item.BSN_STATE_NM,
            telNo: item.LOCPLC_FACLT_TELNO,
            updateTime: updateTime
        }));
    }catch (e) {
        console.log("Error in filterHospitals", e);
        return [];
    }
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
