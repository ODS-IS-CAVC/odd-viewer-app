import './App.css';
import whiteLogo from './Logotype_White.svg';
import { useState } from 'react';
import { OddViewer } from './components/OddViewer';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';


function App() {

  // 事業者ID、パスワード、アクセストークン格納用
  const[businessId, setBusinessId] = useState("");
  const[password, setPassword] = useState("");
  const[accessToken, setAccessToken] = useState("");

  // 事業者IDとパスワードが入力されたことをきっかけに、入力値が格納される
  const businessIdChange = (e) => setBusinessId(e.target.value);
  const passwordChange = (e) => setPassword(e.target.value);

  // 画面の描画を切り替えるために使用
  // classNameの三項演算子において、初期表示時はtrueが適応される
  const [loginDisplay, setloginDisplay] = useState(true) ;

  // ログインボタン押下時に実行される処理
  async function UserAuthentication () {
    
    // クライアント認証
    const url = 'https://auth-autonomous-dx.dts-digiline.com/auth/client';
    
    // BusinessIdとPasswordをリセットする処理
    const loginFormClear = () => {
      setBusinessId("");
      setPassword("");
    }

    // ログイン失敗時の処理（アラートおよび、ユーザー入力値のリセット）
    const loginFailure = () => {
      alert("認証に失敗しました。再度、事業者IDとパスワードを送信してください。");
      loginFormClear();
    }

    // API呼び出し時に必要な情報を格納
    const requestOptions = {
      method: 'POST',
      headers:{
        'Content-Type': 'application/json',
        'apiKey' : 'c60eb1e2-04f9-45a3-867c-f667108bb12d',
      },
      body: JSON.stringify({"clientId": `${businessId}`, "clientSecret": `${password}`})
    };

    // ユーザ当人認証のリクエスト送信
    try{
      const response = await fetch(url, requestOptions, {mode:"cors"});
      const responseJson = await response.json(); 

      if (response.ok) {
        // レスポンスからアクセストークンを取得
        setAccessToken(responseJson.accessToken);

        // ログイン画面再表示時に入力値を残さないためリセット
        loginFormClear();
        
        // ログイン画面のclassNameをfalseに変更し、地図画面へ切り替え
        setloginDisplay(false); 
        
      } else {
        loginFailure();

      }

    } catch (error) {
        loginFailure();

    }    
  }


  return (
    <>
      <div className={loginDisplay ? 'login background' : 'none' }>

        {/* 画面左上のロゴ */}
        <div className='logo'>
          <img src={whiteLogo} width={128} height={128} ></img>
        </div>

        {/* ログインフォーム本体 */}
        <div className='mainContainer'>
          <div>
            <h1>ODD VIEWER</h1>
          </div>
          <div className='form-controll'>

            {/* BusinessID入力部分 */}
            <fieldset className="form-group form-border flex">
              <legend className='text-xs'>&nbsp;*Business ID&nbsp;</legend>
              <div>
                <AccountCircleOutlinedIcon color='disabled' fontSize='large' sx={{marginTop:1.25}}/>
                </div>
              <input type="text" value={businessId} placeholder='Enter Business ID'
              onChange={businessIdChange}
              ></input>
            </fieldset>

            {/* Password入力部分 */}
            <fieldset className="form-group form-border flex">
              <legend className='text-xs'>&nbsp;*PASSWORD&nbsp;</legend>
              <div>
                <LockOutlinedIcon color='disabled' fontSize='large' sx={{marginTop:1.25}}/>
              </div>
              <input type="password" value={password} placeholder='Enter your password'
              onChange={passwordChange}
              ></input>
            </fieldset>

            {/* ログインボタン */}
            <div className="form-group">
              <button type="submit" className="submit-btn" onClick={UserAuthentication}>LOGIN</button>
            </div>
          </div>
        </div>

        {/* アクセストークン格納先 */}
        <div hidden>
          {accessToken}
        </div>
      </div>

      {/* 地図画面用divタグ */}
      {/* ログイン画面では、CSSの適用なし、中身は空 */}
      {/* 認証成功時、画面全体に表示および地図画面の描画開始 */}
      <div className={loginDisplay ?  "" : "screenall" }>
      {loginDisplay ? "" : <OddViewer accessToken={accessToken}/> }
      </div>

    </>
  );
}

export default App;
