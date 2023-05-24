import axios from 'axios';
import * as crypto from "crypto";

/** DB 쿼리 실행 **/
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
            /** 경기도 공공데이터 API URL에서 queryString으로 pSize, pIndex를 전달하도록 한다.
             * pIndex: 1 부터, pSize: 최대 1,000까지 **/
            const url: string = `https://openapi.gg.go.kr/Animalhosptl?key=${PUBLIC_API_KEY}&type=json&pSize=${pageSize}&pIndex=${pageIndex}`;
            let config: object = {
                maxBodyLength: Infinity,
                headers: {}
            };
            console.log("config", config);

            let results = await axios.get(url, config);
            console.log("results", results);

            /** API Response에서 Animalhosptl 값은 반드시 존재해야 한다. **/
            if(!results.data || (results.data && !results.data.Animalhosptl)){
                console.log("Data not exist");
                continue;
            }

            /** list_total_count 값은 페이지네이션과 상관없이 경기도 동물병원의 전체 갯수 **/
            const listTotalCount = results.data.Animalhosptl[0].head[0].list_total_count;
            array = [...array, ...results.data.Animalhosptl[1].row];

            if(array.length >= listTotalCount){
                console.log("Search finished", pageIndex);
                break;
            }
        }

        return array;
    }catch (e) {
        console.log("Error in callPublicAPI", e);
        return [];
    }
}

/** API Response에서 폐업은 제외하고 전달하도록 한다. **/
export function filterHospitals(hospitals: any[]): any[] {
    try{
        const updateTime: string = new Date().toISOString();
        return hospitals.filter(item => {
            /** 폐업이 아니고, REFINE_ROADNM_ADDR 값이 있어야 return **/
            if (!item.BSN_STATE_NM.includes('폐업') && item.REFINE_ROADNM_ADDR)
                return item;
        }).map(item => ({
            /** DB에 넣기 위한 데이터 포맷 변경 **/
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

/** sleep 함수 **/
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
