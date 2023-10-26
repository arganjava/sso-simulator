var express = require('express');
const https = require('https')
const axios = require("axios");
var router = express.Router();
const jose = require('jose')

/* GET users listing. */
router.get('/io-sso', function(req, res, next) {
  let ssoUrl = process.env.IO_SSO_URL
  let clientId = process.env.IO_SSO_CLIENT_ID
  let redirectURI = process.env.IO_SSO_REDIRECT_URI
  let ioSsoScope = process.env.IO_SSO_SCOPE
  let responseType = process.env.IO_SSO_REDIRECT_RESPONSE_TYPE
  let responseMode = process.env.IO_SSO_REDIRECT_RESPONSE_MODE
  let urlSso = `${ssoUrl}?client_id=${clientId}&redirect_uri=${redirectURI}&response_type=${responseType}&response_mode=${responseMode}&scope=${ioSsoScope}`

  res.send(urlSso);
});

router.get('/verify', async function(req, res, next) {
  console.log("req.query.code ", req.query.code)
  const params = {
    client_id: process.env.IO_SSO_CLIENT_ID,
  //  client_secret: process.env.IO_SSO_CLIENT_SECRET,
    code: req.query.code,
    redirect_uri: process.env.IO_SSO_REDIRECT_URI,
    response_type: "token",
    grant_type: "authorization_code",
    scope: ["openid","identity"],
  }
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  })
  axios.defaults.httpsAgent = httpsAgent
  const urlParams = new URLSearchParams()
  Object.keys(params).forEach((key) => urlParams.append(key, params[key]))
  try {
    const response = await axios.default.post(process.env.IO_SSO_VERIFY_CODE_URL, params, {
      headers: { "Content-Type": "application/json" },
    })
    console.log("res token", response.data)

    // const user = await axios.default.get(process.env.IO_SSO_USER_INFO_URL, {
    //   headers: { Authorization: `Bearer ${response.data.id_token}` },
    // })


    const jwks = await axios.default.get("https://localhost:3002/jwks", {
    })

    console.log("jwks ", jwks.data)
    const publicKey = await jose.importJWK(jwks.data)

    const { payload, protectedHeader } = await jose.jwtVerify(response.data.id_token, publicKey)

    console.log(protectedHeader)
    console.log("DECODE ",payload)


    console.log("res user", payload)
    res.render('verify', {title: 'Imaginary Ride', code: req.query.code, tokenData: response.data, user:payload});
  }catch (e){
    console.log("err res", e)
    res.render('verify', {title: 'Imaginary Ride', code: req.query.code, error: e.message});
  }

});


router.post('/io-sso/authorize', function(req, res, next) {
  console.log("req.body", req.body)

  res.send('respond with a resource');

});

module.exports = router;
