import React from "react";
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import './Map.css';
import { useState, useEffect } from "react";
import { SimpleMarker, GreyMarker } from "./SimpleMarker";
import { TrafficLight, GreyTrafficLight } from "./TrafficLight";

export const Map = ({accessToken, mapDisplayChange, tempMapDisplay}) => {

    // 〒319-1221 茨城県日立市大みか町1丁目16−2の緯度経度
    const position = [36.510018,140.624406];

    // ズームレベルの初期値を格納
    const zoom = 16;

    // マーカー表示（信号機）位置の格納用
    const [locationsTrafficLight, setLocationsTrafficLight] = useState([]);

    // マーカー表示（信号機以外）位置の格納用
    const [locationsMarker, setLocationsMarker] = useState([]);

    // マーカー表示（信号機グレー）位置の格納用
    const [locationsGreyTrafficLight, setLocationsGreyTrafficLight] = useState([]);

    // マーカー表示（信号機以外グレー）位置の格納用
    const [locationsGreyMarker, setLocationsGreyMarker] = useState([]);

    // 稼働停止状態の路側機名称格納用
    const [dieAlert, setDieAlert] = useState([]);

    // 路駐車有りの場合の路側機名称格納用
    const [parkingCarAlert, setParkingCarAlert] = useState([]);

    // エラー発生検知用変数
    let errFlag = false;

    // サービス地点情報取得APIのURL
    const urlServiceLocation = 'https://con-env-autonomous-dx.dts-digiline.com/serviceLocationInfo?serviceLocationID=';

    // 路側機属性情報取得APIのURL
    const urlRoudesideUnitInfo = 'https://con-env-autonomous-dx.dts-digiline.com/roadsideUnitInfo?serviceLocationID=replaceServiceLocationID&roadsideUnitID=replaceRoadsideUnitID';

    // 死活情報取得APIのURL
    const urlAliveMoniteringInfo = 'https://con-env-autonomous-dx.dts-digiline.com/aliveMonitoringInfo?serviceLocationID=replaceServiceLocationID&roadsideUnitID=replaceRoadsideUnitID';
    
    // 物標情報取得APIのURL
    const urlTargetInfo = 'https://con-env-autonomous-dx.dts-digiline.com/targetInfo?serviceLocationID=replaceServiceLocationID&roadsideUnitID=replaceRoadsideUnitID';

    // headerなどAPIのオプション
    const requestOptions = {
        method: 'GET',
        headers:{
          'Content-Type': 'application/json',
          'Authorization':`Bearer ${accessToken}`,
          'apiKey' : 'c60eb1e2-04f9-45a3-867c-f667108bb12d',
        },
      };


    // すべてのサービス地点ID
    const allServicelocationID = [
        8202302,
        8202303,
        8202304,
      ];

    // 路側機ID格納先
    let roadsideUnitID = 0;

    // 路側機種別格納先
    let roadsideUnitClassification = 0;

    // 路側機情報の一時格納先
    let tempRoadsideUnitInfo = [];
    
    // API呼び出し失敗時のアラート文
    const apiCallFailureAlert = () => {
        alert("エラーが発生しました。再度ログインしてください。");
    }

    // 情報取得失敗時のアラート文
    const apiResponseFailureAlert = () => {
        alert("情報取得でエラーが発生しました。再度情報を取得します。");
    }


    // サービス地点情報取得APIを呼ぶ関数
    const callServiceLocation = async(servicelocationID) => { 

        // APIのURL作成
        const url = urlServiceLocation + servicelocationID;

        try{
            const response = await fetch(url, requestOptions);

            if (response.ok) {
            const responseJson = await response.json(); 
            const roadsideUnitList = responseJson.attribute.roadsideUnitList;
                
                for (let j = 0; j < roadsideUnitList.length; j++){

                    // 路側機IDの取得
                    roadsideUnitID = roadsideUnitList[j].roadsideUnitID;

                    // 路側機種別の取得
                    roadsideUnitClassification = roadsideUnitList[j].roadsideUnitClassification;

                    // 401エラー発生後、後続の処理を呼び出さないためにbreak
                    if(errFlag===true) { 
                        break;
                    }

                    // 路側機属性情報取得APIのリクエスト
                    await callRoadsideUnitInfo(servicelocationID,roadsideUnitID,roadsideUnitClassification);

                    // 401エラー発生後、後続の処理を呼び出さないためにbreak
                    if(errFlag===true) { 
                        break;
                    }

                    // 死活情報取得APIのリクエスト
                    await callAliveMoniteringInfo(servicelocationID, roadsideUnitID);

                    // 401エラー発生後、後続の処理を呼び出さないためにbreak
                    if(errFlag===true) { 
                        break;
                    }

                    // 物標情報取得APIのリクエスト
                    await callTargetInfo(servicelocationID, roadsideUnitID);

                    // 401エラー発生後、後続の処理を呼び出さないためにbreak
                    if(errFlag===true) { 
                        break;
                    }
                    
                    // ポップアップと警告文の判断
                    await judgementPopupAndAlert();
                }

            } else if(response.status === 401){
                
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
                callServiceLocation(servicelocationID);
            }

        } catch(error) {

            // エラーのポップアップ表示
            apiResponseFailureAlert();

            // 再度APIを呼び出す
            callServiceLocation(servicelocationID);
        }
    }

    
    // 路側機属性情報取得APIを呼ぶ関数
    const callRoadsideUnitInfo = async (tempServiceLocationID, roadsideUnitID, roadsideUnitClassification) => {

        // APIのURL作成
        const url = urlRoudesideUnitInfo.replace('replaceServiceLocationID',tempServiceLocationID).replace('replaceRoadsideUnitID',roadsideUnitID);

        try{
            const response =  await fetch(url, requestOptions);

            if (response.ok) {
            const responseJson =  await response.json(); 
                
                // 一次保存の変数に路側機情報を格納
                tempRoadsideUnitInfo.push({

                    // 緯度（レスポンスの値が整数であり、丸め誤差の発生を防ぐため、10000000で除算する）
                    latitude: responseJson.attribute.latitude / 10000000, 

                    // 経度（緯度と同様の理由から、10000000で除算する）
                    longitude: responseJson.attribute.longitude / 10000000, 

                    // 路側機名称
                    name: responseJson.attribute.roadsideUnitName, 

                    // 路側機種別
                    type: roadsideUnitClassification,

                    // 路側機ID
                    number: roadsideUnitID,

                    // サービス地点ID
                    serviceLocation: tempServiceLocationID,
                });
                
            } else if(response.status === 401){

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
                callRoadsideUnitInfo(tempServiceLocationID, roadsideUnitID, roadsideUnitClassification);
            }
            
        } catch(error) {
            
            // エラーのポップアップ表示
            apiResponseFailureAlert();
            
            // 再度APIを呼び出す
            callRoadsideUnitInfo(tempServiceLocationID, roadsideUnitID, roadsideUnitClassification);
        }
    }


     // 死活情報取得APIを呼ぶ関数
     const callAliveMoniteringInfo = async (tempServiceLocationID, roadsideUnitID) => {

        // APIのURL作成
        const url = urlAliveMoniteringInfo.replace('replaceServiceLocationID',tempServiceLocationID).replace('replaceRoadsideUnitID',roadsideUnitID);

        try{
            const response =  await fetch(url, requestOptions);

            if (response.ok) {
            const responseJson =  await response.json(); 

                // 配列末尾の添字
                const indexAliveMonitering = tempRoadsideUnitInfo.length - 1;

                // 取得したサービス提供可否を一次格納用の配列末尾へ追加する
                tempRoadsideUnitInfo[indexAliveMonitering].serviceAvailability = responseJson.attribute.serviceAvailability;

            } else if(response.status === 401){

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
                callAliveMoniteringInfo(tempServiceLocationID, roadsideUnitID);
            }
            
        } catch(error) {

            // エラーのポップアップ表示
            apiResponseFailureAlert();
            
            // 再度APIを呼び出す
            callAliveMoniteringInfo(tempServiceLocationID, roadsideUnitID);
        }
    }

    // 物標情報取得APIを呼ぶ関数
    const callTargetInfo = async (tempServiceLocationID, roadsideUnitID) => {

        const url = urlTargetInfo.replace('replaceServiceLocationID',tempServiceLocationID).replace('replaceRoadsideUnitID',roadsideUnitID);

        try{
            const response =  await fetch(url, requestOptions);

            if (response.ok) {
            const responseJson =  await response.json(); 

            // 物標情報の配列を格納
            const streetParkingInfo = responseJson.attribute.deviceIndividualInfo;
            
            // 路駐車の有無を格納する変数
            let parkingCar = false;

            // 物標の停止時間が140秒を超えたとき、路駐車有りと判断
            for (let k = 0; k < streetParkingInfo.length; k++){

                for (let l = 0; l < streetParkingInfo[k].targetIndividualInfo.length; l++){ 

                    const restingState = streetParkingInfo[k].targetIndividualInfo[l].restingState;

                    if(140 <= restingState && restingState < 3601){
                        parkingCar = true;
                        break;
                    }
                }
            }

            // 配列末尾の添字
            const indexTargetInfo = tempRoadsideUnitInfo.length - 1;

            // 位置時格納先に路駐車情報を追加
            tempRoadsideUnitInfo[indexTargetInfo].parkingCar = parkingCar;
                
            } else if(response.status === 401){

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
                callTargetInfo(tempServiceLocationID, roadsideUnitID);
            }
            
        } catch(error) {

            // エラーのポップアップ表示
            apiResponseFailureAlert();
            
            // 再度APIを呼び出す
            callTargetInfo(tempServiceLocationID, roadsideUnitID);
        }

    }

    // 地図画面に描画するポップアップと警告文の判断
    const judgementPopupAndAlert = () => {

        // 判断する配列の添字格納
        const indexJudgement = tempRoadsideUnitInfo.length - 1;

        // 路側機種別とサービス提供可否によって、ポップアップの種類と警告文の有無を判断
        // 路側機種別が信号機の場合
        if(tempRoadsideUnitInfo[indexJudgement].type===1){

            // サービス提供可否がサービス提供不可の場合
            if(tempRoadsideUnitInfo[indexJudgement].serviceAvailability===2){

                // 信号機アイコン（グレー）の情報を追加
                // 現時点の配列をもとに同じ内容の新しい配列を作成し、そこに緯度経度等を追加する
                setLocationsGreyTrafficLight(prevLocationsGreyTrafficLight => [
                    ...prevLocationsGreyTrafficLight, tempRoadsideUnitInfo[indexJudgement]
                ]);
                // 警告文表示用に情報を格納
                setDieAlert(prevDieAlert => [
                    ...prevDieAlert, tempRoadsideUnitInfo[indexJudgement]
                ]);

            } else {
                // 信号機アイコンの情報を追加
                setLocationsTrafficLight(prevLocationsTrafficLight => [
                    ...prevLocationsTrafficLight, tempRoadsideUnitInfo[indexJudgement]
                ]);
            }

        // 路側機種別が信号機以外の場合
        } else {
            if(tempRoadsideUnitInfo[indexJudgement].serviceAvailability===2){

                // 信号機以外のアイコン（グレー）の情報を追加
                setLocationsGreyMarker(prevLocationsGreyMarker => [
                    ...prevLocationsGreyMarker, tempRoadsideUnitInfo[indexJudgement]
                ]);
                // 警告文表示用に情報を格納
                setDieAlert(prevDieAlert => [
                    ...prevDieAlert, tempRoadsideUnitInfo[indexJudgement]
                ]);

            } else {
                // 信号機以外のアイコンの情報を追加
                setLocationsMarker(prevLocationsMarker => [
                    ...prevLocationsMarker, tempRoadsideUnitInfo[indexJudgement]
                ]);
            }
        }

        // 路駐車の有無によって警告文表示に必要な情報を格納
        if(tempRoadsideUnitInfo[indexJudgement].parkingCar === true){

            setParkingCarAlert(prevParkingCarAlert => [
                ...prevParkingCarAlert, tempRoadsideUnitInfo[indexJudgement]
            ]);
        }
    }

    
    useEffect(() => {

        // サービス地点の数だけサービス地点情報取得APIを呼び出す関数
        const callEnvironmentInformationSystem = async () => {

            for (let i = 0; i < allServicelocationID.length; i++){
                
                // エラー発生時は処理を中断する
                if (errFlag) {
                    break;
                }

                if (tempMapDisplay === false) {
                    break;
                }

                await callServiceLocation(allServicelocationID[i]);

            }
        }

        // 初回のAPI呼び出し
        callEnvironmentInformationSystem();

                
        // 1秒ずつカウントするための変数
        let countMapTime = 0;

        // タイマーで1秒ごと呼び出す
        const interval = setInterval(() => {

            // 1秒カウントを増やす
            countMapTime++;

            // 1分経過時、情報のクリアとAPIのリクエストを行う
            if(countMapTime === 60) {

                // 数えた秒数を0にリセットする
                countMapTime = 0;

                // エラー未発生は下記の処理を実行
                if(errFlag === false){

                    // 格納した路側機の情報をクリアする
                    tempRoadsideUnitInfo = [];
                    setLocationsTrafficLight([]);
                    setLocationsMarker([]);
                    setLocationsGreyTrafficLight([]);
                    setLocationsGreyMarker([]);
                    setDieAlert([]);
                    setParkingCarAlert([]);
                    
                    // 環境情報連携システムからAPIを呼び出す
                    callEnvironmentInformationSystem();
                }
            }

        },1000);

        return () => {

            // タイマーをクリアする
            clearInterval(interval);

        }
    },[tempMapDisplay]);


    return(
        <>
            {/* 画面左側の要素を格納 */}
            <div className="oddView">

                {/* 地図画面表示領域  */}
                <div className="mapView">

                    {/* 地図オブジェクト作成 */}
                    <MapContainer 

                        // 地図の中央とズームレベル初期値
                        center={position} 
                        zoom={zoom} 

                        // 画面左上にズームボタン（＋ー）が表示されるのでfalse
                        zoomControl={false} 

                        // ズームボタン以外の地図の拡縮、移動を制限
                        doubleClickZoom={false} 
                        dragging={false} 
                        scrollWheelZoom={false} 
                        closePopupOnClick={false}>

                        {/* 地図タイルの取得 */}
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* ズームボタンの位置を右下へ */}
                        <ZoomControl position="bottomright" />

                        {/* 信号機のアイコン表示 */}
                        {locationsTrafficLight.map((locationTrafficLight, indexTrafficLight) => (
                            <TrafficLight 
                                key={`${locationTrafficLight.number}-${locationTrafficLight.serviceLocation}-${indexTrafficLight}`}
                                position={[locationTrafficLight.latitude, locationTrafficLight.longitude]}
                                locationName={locationTrafficLight.name}
                                streetParkingCar={locationTrafficLight.parkingCar}
                            />
                        ))}

                        {/* 信号機以外のアイコン表示 */}
                        {locationsMarker.map((locationMarker, indexMarker) => (
                            <SimpleMarker 
                                key={`${locationMarker.number}-${locationMarker.serviceLocation}-${indexMarker}`}
                                position={[locationMarker.latitude, locationMarker.longitude]}
                                locationName={locationMarker.name}
                                streetParkingCar={locationMarker.parkingCar}
                            />
                        ))}

                        {/* 信号機のアイコン（グレー）表示 */}
                        {locationsGreyTrafficLight.map((locationGreyTrafficLight, indexGreyTrafficLight) => (
                            <GreyTrafficLight 
                                key={`${locationGreyTrafficLight.number}-${locationGreyTrafficLight.serviceLocation}-${indexGreyTrafficLight}`}
                                position={[locationGreyTrafficLight.latitude, locationGreyTrafficLight.longitude]}
                                locationName={locationGreyTrafficLight.name}
                                streetParkingCar={locationGreyTrafficLight.parkingCar}
                            />
                        ))}

                        {/* 信号機以外のアイコン（グレー）表示 */}
                        {locationsGreyMarker.map((locationGreyMarker, indexGreyMarker) => (
                            <GreyMarker 
                                key={`${locationGreyMarker.number}-${locationGreyMarker.serviceLocation}-${indexGreyMarker}`}
                                position={[locationGreyMarker.latitude, locationGreyMarker.longitude]}
                                locationName={locationGreyMarker.name}
                                streetParkingCar={locationGreyMarker.parkingCar}
                            />
                        ))}

                    </MapContainer>
                </div>

                {/* 警告文表示領域 */}
                <div className="alertView overflow">

                    {/* 警告文表示（稼働停止） */}
                    {dieAlert.map((dieUnit, indexDie) => 
                        <p key={`${dieUnit.number}-${dieUnit.serviceLocation}-${indexDie}`}>
                            &nbsp;【警告】⚠<br></br>
                            &nbsp;運行経路上の路側デバイスが停止しました。（路側機名称：{dieUnit.name}）
                        </p>
                    )}

                    {/* 警告文表示（路駐車） */}
                    {parkingCarAlert.map((parkingCarItem, indexParking) => 
                        <p key={`${parkingCarItem.number}-${parkingCarItem.serviceLocation}-${indexParking}`}>
                            &nbsp;【警告】⚠<br></br>
                            &nbsp;運行経路上に路駐車の存在を検知しました。注意喚起（路側機名称：{parkingCarItem.name}）
                        </p>
                    )}

                </div>

            </div>

        </>

    )
}