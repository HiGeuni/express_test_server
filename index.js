const express = require("express");
const multer = require("multer");
const axios = require("axios");
const qs = require("qs");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const sse = require('sse');
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const PORT = 8080;

let count = 1;

const app = express();

const server = http.createServer(app);

sse(server);

app.use(cookieParser());
app.use(bodyParser.json());

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

app.use(cors(corsOptions));
dotenv.config();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});

// face recognition with socket
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads");
    },
    filename: (req, file, cb) => {
      console.log(file);
      cb(null, file.originalname);
    },
  }),
});

app.post("/attendance/face_recognition", upload.single("image"), (req, res) => {
  const image = req.file;
  console.log(image);
  console.log("Success!");

  res.send("Image uploaded successfully!");
});

// kakao login

app.get("/auth/kakao", (req, res) => {
  //axios>>promise object
  let token;
  token = axios({
    //token
    method: "POST",
    url: "https://kauth.kakao.com/oauth/token",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    data: qs.stringify({
      grant_type: "authorization_code",
      client_id: process.env.REACT_APP_KAKAO_REST_API_KEY,
      client_secret: process.env.REACT_APP_KAKAO_CLIENT_SECRET_KEY,
      redirectUri: "",
      code: req.query.code,
    }),
  }).then((ans) => {
    res.cookie("kakaoToken", ans.data.access_token, {
      expires: new Date(Date.now() + 86400000), // 쿠키의 만료 시간 설정 (예: 24시간 후)
      httpOnly: true, // 클라이언트 측 JavaScript에서 쿠키에 접근할 수 없도록 설정
      secure: false,
      sameSite: "none", // Cross-Site 요청 시에도 쿠키를 전송
    });
    res.send({ state: 200, message: "Success!", token: ans.data.access_token });
  });
});

app.get("/login/oauth/access_token", (req, res) => {
  axios
    .post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.REACT_APP_GITHUB_CLIENT_ID,
        client_secret: process.env.REACT_APP_GITHUB_CLIENT_SECRET,
        code: req.query.code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    )
    .then((resp) => {
      const token = resp.data.access_token;
      axios
        .get("https://api.github.com/user?token", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((resp) => {
          const data = resp.data;
          const token = jwt.sign(
            {
              type: "JWT",
              nickname: data.name,
            },
            "12345",
            {
              expiresIn: "15m", // 만료시간 15분
              issuer: "yhw",
            }
          );
          res.send({
            token: token,
          });
        });
    });
});

app.post("/google/access_token", (request, response) => {
  const code = request.body.code;
  const client_id = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const client_secret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;
  axios
    .post("https://oauth2.googleapis.com/token", {
      client_id: client_id,
      client_secret: client_secret,
      code: request.body.code,
      grant_type: "authorization_code",
      redirect_uri: "http://localhost:3000/auth/callback/google",
    })
    .then((res) => {
      response.send({ token: res.data.id_token });
    });
});

app.get('/', (request, response) => {
  response.send(`ABC : ${process.env.ABC}`);
})

app.get("/test", (req, res) => {
  const t = process.env.EV;
  console.log(t);
  res.send(t)
})

app.get("/test2", (req, res) => {
  count +=1 ;
  console.log(count);
  res.send(count.toString());
})


const SSEController = require('./sse');
const http = require("http");

const controller = new SSEController();

app.get('/start', (req, res) => controller.subscribe(req, res));

app.get('/stop', (req,res) => controller.unsubscribe(res))

// server start
server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
