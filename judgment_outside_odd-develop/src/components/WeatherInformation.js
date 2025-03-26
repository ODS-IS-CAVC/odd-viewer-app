import { useEffect, useState } from "react"

export const WeatherInformation = ({accessToken, mapDisplayChange, tempMapDisplay}) => {

    // 気象情報格納用
    const [weatherInfo , setWeatherInfo] = useState([]);

    // APIを呼ぶ回数（72時間先までの気象情報を取得するので72回）
    const callAPITime = 72;

    // エラー発生検知用変数
    let errFlag = false;

    // API呼び出し失敗時のアラート文
    const apiCallFailureAlert = () => {
        alert("エラーが発生しました。再度ログインしてください。");
    }

    // 情報取得失敗時のアラート文
    const apiResponseFailureAlert = () => {
        alert("情報取得でエラーが発生しました。再度情報を取得します。");
    }

    // APIで取得した数値から天気へ変換
    const weatherTranslateString = (responseWeather) => {
        let tempWeather = "";
        switch(responseWeather) {
            case "100":
                tempWeather = "晴";
                break;
            case "200":
                tempWeather = "曇";
                break;
            case "300":
                tempWeather = "雨";
                break;
            case "400":
                tempWeather = "雪";
                break;
            case "500":
                tempWeather = "みぞれ";
                break;
        }
        return tempWeather;
    }

    // APIで取得した風向の数値から方角へ変換
    const windDirectionTranslateString = (responseWindDirection) => {
        let tempWindowDirection = "";
        switch(true) {
            case responseWindDirection == 0:
                tempWindowDirection = "静穏";
                break;
            case responseWindDirection <= 11.2:
                tempWindowDirection = "北";
                break;
            case responseWindDirection <= 33.7:
                tempWindowDirection = "北北東";
                break;
            case responseWindDirection <= 56.2:
                tempWindowDirection = "北東";
                break;
            case responseWindDirection <= 78.7:
                tempWindowDirection = "東北東";
                break;
            case responseWindDirection <= 101.2:
                tempWindowDirection = "東";
                break;
            case responseWindDirection <= 123.7:
                tempWindowDirection = "東南東";
                break;
            case responseWindDirection <= 146.2:
                tempWindowDirection = "南東";
                break;
            case responseWindDirection <= 168.7:
                tempWindowDirection = "南南東";
                break;
            case responseWindDirection <= 191.2:
                tempWindowDirection = "南";
                break;
            case responseWindDirection <= 213.7:
                tempWindowDirection = "南南西";
                break;
            case responseWindDirection <= 236.2:
                tempWindowDirection = "南西";
                break;
            case responseWindDirection <= 258.7:
                tempWindowDirection = "西南西";
                break;
            case responseWindDirection <= 281.2:
                tempWindowDirection = "西";
                break;
            case responseWindDirection <= 303.7:
                tempWindowDirection = "西北西";
                break;
            case responseWindDirection <= 326.2:
                tempWindowDirection = "北西";
                break;
            case responseWindDirection <= 348.7:
                tempWindowDirection = "北北西";
                break;
            case responseWindDirection <= 360.0:
                tempWindowDirection = "北";
                break;
        }
        return tempWindowDirection;
    }

    // APIで取得した各気象情報の値を確認する（65535.0の場合は空で返却）
    const  evaluateMeteorologicalValue = (responseMeteorologicalValue) => {

        let tempMeteorologicalValue = responseMeteorologicalValue;

        if (responseMeteorologicalValue == 65535.0) {
            tempMeteorologicalValue = "";
        }

        return tempMeteorologicalValue;
    }

    // 準動的APIのURL
    const urlSemiDynamicInfo = 'https://con-vehicle-autonomous-dx.dts-digiline.com/semiDynamicInfo?encodedData=';

    // headerなどAPIのオプション
    const requestOptions = {
        method: 'GET',
        headers:{
            'Content-Type': 'application/json',
            'Authorization':`Bearer ${accessToken}`,
            'apiKey' : 'c60eb1e2-04f9-45a3-867c-f667108bb12d',
        },
    };


    const callSemiDynamicInfo = async(callAPIDate) => {

        // クエリパラメータ挿入用
        const targetData = 3;
        const requestFormat = 1;
        const spatialID = "15/0/29183/12809";
        
        // クエリパラメータ格納
        const queryParameter = 
        `{
            "targetTime": "${callAPIDate}",
            "requestInfo": [
                {
                    "targetData": ${targetData},
                    "requestFormat": ${requestFormat},
                    "requestArea": {
                        "spatialID": "${spatialID}"
                    }
                }
            ]
        }`;
        
        // クエリパラメータをエンコードし、URLと結合
        const encodeUrl = urlSemiDynamicInfo + encodeURIComponent(queryParameter);

        try{
            const response = await fetch(encodeUrl, requestOptions);

            if (response.ok) {

                const responseJson = await response.json(); 
                const responseWeatherInfo = responseJson.attribute.level1[0].weatherInfo;

                // 表示用の日時を作成
                const tempDate = new Date(responseWeatherInfo.dateTime);

                // 気象情報を一時格納
                let tempWeatherInfo = {

                    // 日付
                    date: `${tempDate.getMonth() + 1}月${tempDate.getDate()}日`,

                    // 時間
                    time : `${tempDate.getHours()}:00`,

                    // 天気
                    weather: weatherTranslateString(responseWeatherInfo.weather),

                    // 気温
                    temperature: evaluateMeteorologicalValue(responseWeatherInfo.temperature),

                    // 風向
                    windDirection: windDirectionTranslateString(responseWeatherInfo.windDirection),

                    // 風速
                    windSpeed: evaluateMeteorologicalValue(responseWeatherInfo.windSpeed),

                    // 降水量
                    rainfall: evaluateMeteorologicalValue(responseWeatherInfo.rainfall),

                };

                // 一時格納した情報を配列に追加
                setWeatherInfo(prevWeatherInfo => [
                    ...prevWeatherInfo, tempWeatherInfo])

            } else if(response.status == 401){
                
                // エラー発生時に変更
                errFlag = true;

                // エラーのポップアップ表示
                apiCallFailureAlert();

                // ログイン画面へ遷移するためfalseに変更
                mapDisplayChange(false);

            } else {

                // エラーのポップアップ表示
                apiResponseFailureAlert();

                // 再度APIを呼び出す
                callSemiDynamicInfo(callAPIDate);
            }

        } catch(error) {
            
            // エラーのポップアップ表示
            apiResponseFailureAlert();

            // 再度APIを呼び出す
            callSemiDynamicInfo(callAPIDate);
        }

    }



    useEffect(() => {

        // 車両情報連携システムを呼び出す関数
        const callVehicleInformationSystem = async() => {

            // 現在の日時を取得し格納
            const currentTime = new Date();
            
            // 日付の形式変換用関数
            function formatDate(date, sep="") {
                const yyyy = date.getFullYear();
                const mm = ('00' + (date.getMonth()+1)).slice(-2);
                const dd = ('00' + date.getDate()).slice(-2);
                return `${yyyy}${sep}${mm}${sep}${dd}`;
            }
            
            
            for (let i = 0; i < callAPITime; i++){

                // エラー発生時は処理を中断する
                if (errFlag) {
                    break;
                }

                // 親コンポーネントからエラー発生を検知
                if (tempMapDisplay === false) {
                    break;
                }
                
                // 分以下を切り捨てた日時の作成
                const convertCurrentTime = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), currentTime.getHours());

                // APIを呼び出す時間（hour）の設定
                convertCurrentTime.setHours(convertCurrentTime.getHours() + i)

                // 取得した日付を/区切りに変換する
                const dateSlash = formatDate(convertCurrentTime, "/");

                // 時間を取得する
                let callAPIHour = convertCurrentTime.getHours().toString().padStart(2,'0');

                // APIリクエスト用の日時を作成
                let callAPIDate = `${dateSlash} ${callAPIHour}:00:00`;

                await callSemiDynamicInfo(callAPIDate);
            }
            
        }

        // 初回のAPI呼び出し
        callVehicleInformationSystem();

        // 1秒ずつカウントするための変数
        let countWeatherTime = 0;

        // タイマーで1秒ごと呼び出す
        const interval = setInterval(() => {

            // 1秒ごとにインクリメント
            countWeatherTime++;

            // 15分経過したとき、情報のクリアとAPIの呼び出し
            if(countWeatherTime === 900) {

                // カウントした秒数をリセットする
                countWeatherTime = 0;
            
                // エラー未発生時は下記の処理を実行
                if(errFlag === false){

                    // 格納した気象情報をクリアする
                    setWeatherInfo([]);
                    
                    // 車両情報連携システムからAPIを呼び出す
                    callVehicleInformationSystem();
                }
            }

        },1000);

        return () => {

            // タイマーをクリアする
            clearInterval(interval);

        }

    },[tempMapDisplay]);


    return (
        <>
            <div>
                <h2>大みか町の気象情報</h2>

                <table>
                    {/* 表のヘッダー */}
                    <thead>
                        <tr>
                            <th className="tebleHeader">日付</th>
                            <th className="tebleHeader">時間</th>
                            <th className="tebleHeader">天気</th>
                            <th className="tebleHeader">気温</th>
                            <th className="tebleHeader">降水量</th>
                            <th className="tebleHeader">風向</th>
                            <th className="tebleHeader">風速</th>
                        </tr>
                    </thead>
                
                    {/* 気象情報を表示 */}
                    <tbody>
                    {weatherInfo.map((weatherInfoItem, indexWeatherInfo) => (
                        <tr key={`${indexWeatherInfo}`}>
                            <td className="tableData">{weatherInfoItem.date}</td>
                            <td className="tableData">{weatherInfoItem.time}</td>
                            <td className="tableData">{weatherInfoItem.weather}</td>
                            <td className="tableData">{weatherInfoItem.temperature}</td>
                            <td className="tableData">{weatherInfoItem.rainfall}</td>
                            <td className="tableData">{weatherInfoItem.windDirection}</td>
                            <td className="tableData">{weatherInfoItem.windSpeed}</td>
                        </tr>
                    ))}

                    </tbody>

                </table>
            </div>
        </>
    )
    
}