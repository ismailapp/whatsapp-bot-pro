const { Client , MessageMedia , LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors')
const { body, validationResult } = require('express-validator');
const http = require('http');
const fs = require('fs');
const { phoneNumberFormatter } = require('./formatter');
const { cektoken } = require('./cek-token');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const port = process.env.PORT || 3000;
const app = express();
const bodyParser = require('body-parser');
const server = http.createServer(app);
const jsonParser = bodyParser.json()
// var io = require('socket.io')(server);
// const { resolve, resolve6 } = require('dns/promises');
// const { exit } = require('process');
// const { ok } = require('assert');
var cron = require('node-cron');

/**==============================================================
 * FUNCTION TIME START
 ===============================================================*/
// TZ = "Asia/Makassar";
// let timestamp = new Date().getTime();
// let new_date = new Date();
// let realtime = date("%Y%m%d%H%M%S");
// function date(fstr) {
//   let date = new Date();
//   return fstr.replace (/%[YmdHMS]/g, function (m) {
//     switch (m) {
//     case '%Y': return date['getFullYear'] ();
//     case '%m': m = 1 + date['getMonth'] (); break;
//     case '%d': m = date['getDate'] (); break;
//     case '%H': m = date['getHours'] (); break;
//     case '%M': m = date['getMinutes'] (); break;
//     case '%S': m = date['getSeconds'] (); break;
//     default: return m.slice (1);
//     }
//     return ('0' + m).slice (-2);
//   });
// }
/* date("%Y-%m-%d %H:%M:%S")
 returns "2012-05-18 05:37:21" */
//  setInterval(cek,1000);
//  function cek(){
//     console.log(date("%d-%m-%Y %H:%M:%S"));
//  }
/**==============================================================
 * FUNCTION TIME END
 ===============================================================*/
/**==============================================================
 * JSON DB START
 ===============================================================*/
const BASE_URL = './base.json';
let base = (fs.existsSync(BASE_URL))?require(BASE_URL):'';
let base_url = base.url;
let date = new Date();
/**==============================================================
 * JSON DB END
 ===============================================================*/

// CEK BACKEND NODE-CRON START
let cek_server = base_url+"whatsapp/get_users/hp/083136245050"; 
let no =1;
var task = cron.schedule('0-59 * * * * *', () => {
  axios
  .get(cek_server)
    .then( async (res) => {
        if(res.data){
          const resp = res.data;
           // Object.entries(resp).forEach((entry) => {
           //    const [key, value] = entry;
           //    console.log(`${key} : ${value.hp} : ${value.akses}`);
           //  });
         console.log(resp);
        } 
     });
  // console.log(no+++' '+cek_server);
  }, {
  scheduled: false
});

  axios.get(cek_server)
    .then(res => {
       task.start();
        console.log('Backend Ready')
     })
    .catch((error) => {
        task.stop();
        console.log('Backend Not Found')
      });
// CEK BACKEND NODE-CRON END

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(fileUpload({
  debug: false
}));
app.use(cors())
const checkRegisteredNumber = async function(number) {
  const isRegistered = await client.isRegisteredUser(number);
  return isRegistered;
}

//====================================================================================
//---------------------------------------------
const client = new Client({
  authStrategy: new LocalAuth(),
  restartOnAuthFail: true,
  puppeteer: { 
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ]
   }
});
//---------------------------------------------

client.initialize();

let status = "NOT READY";
let qrcode_return = 'Loading...';

/**==============================================================
 * APP EXPRESS START
 ===============================================================*/
 let inc;
app.get('/', (req, res) => {
  res.sendFile('page.html', {
    root: __dirname
  });
});
//---------------------------------------------

app.get("/getChat", async (req, res) => {
  let chats = await client.getChats();
  //console.log(chats);
  let final = [];
  for (const chat of chats) {
      let pesan = await chat.fetchMessages({limit : 50});
      let response = JSON.stringify(pesan);
      let r = JSON.parse(response);
      final.push(r);
  }
  res.status(200).json({
    status: true,
    response: final
  });
});
//---------------------------------------------
//---------------------------------------------
app.get("/qr", (req, res) => {
  res.status(200).json({
      status: true,
      code: "200",
      qr: qrcode_return
  });
});
//---------------------------------------------
//---------------------------------------------
app.get("/me_data", (req, res) => {
  inc = (client.info)?client.info:false;
  if(inc){
   var nomor = inc.wid.user;
    res.status(200).json({
        nama:inc.pushname,
        hp: nomor.replace('62','0')
    });
  }else{
    res.status(200).json({
        status:"Belum Terkai No Whatsapp",
        code:"404"
    });
  }
});
//---------------------------------------------
//---------------------------------------------
app.get("/status", (req, res) => {
  // res.setHeader('Content-Type', 'application/json');
  if(status=='READY'){
    res.status(200).json({
      status: status,
      code: '200'
    });
  }else if(status=='DEVICE NO INTERNET'){
    res.status(501).json({
      status: status,
      code: '501'
    });
  }else{
    res.status(201).json({
      status: status,
      code: '201'
    });
  }
});
//---------------------------------------------
// =================================================================
app.post("/callback", jsonParser, [
  body('token').notEmpty(),
  body('url').notEmpty(),
], async (req, res) => {
      //==== CEK API-KEY
  const token = cektoken(req.body.token);
  if(!token){r200('API-KEY-SALAH',res);return;}
  else
  {
    base_url =req.body.url
      fs.writeFile(BASE_URL, '{"url":"'+req.body.url+'"}', function (err) {
          if (err) {
              r200(err,res);
              console.error(err);
          }else{
            r200('CALLBACK SERVER SAVE',res);
            console.log('CALLBACK SERVER SAVE');
            process.exit();
          }
      });
    return;
  }
});
// =================================================================
// =================================================================
app.post("/logout", jsonParser, [
  body('token').notEmpty(),
], async (req, res) => {
    //==== CEK API-KEY
  const token = cektoken(req.body.token);
  if(!token){r200('API-KEY-SALAH',res);return;}
  else
  {
     status="NOT READY";
     r200('Berhasil Keluar',res);
      await client.logout().then(()=>{
        client.initialize();
      });
    return;
  }
     
});
// =================================================================
// Send MEDIA START ================================================
app.post('/send-media', jsonParser, async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });
  
  const caption = req.body.caption;
  const file = req.body.file;
//==== CEK READY
  if(!cek_ready(res)){return;}
  //==== CEK API-KEY
  const token = cektoken(req.body.token);
  if(!token){r200('API-KEY-SALAH',res);return;}
  //==== CEK NO WA START
  const number = phoneNumberFormatter(req.body.number);
  const cekno = await cek_nomor(number,res);
  if(!cekno){return;}
  //==== CEK NO WA STOP
  //==== CEK ERROR
  if(!errors.isEmpty()){r200(errors.mapped(),res);return;}
  // const media = MessageMedia.fromFilePath('./image-example.png');
  // const file = req.files.file;
  // const media = new MessageMedia(file.mimetype, file.data.toString('base64'), file.name);
  let mimetype;
  const attachment = await axios.get(base_url+'file/wa_media/'+file, {
    responseType: 'arraybuffer'
  }).then(response => {
    mimetype = response.headers['content-type'];
    return response.data.toString('base64');
  });

  const media = new MessageMedia(mimetype, attachment, 'Media');

  client.sendMessage(number, media, {
    caption: caption
  }).then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
});
// Send MEDIA END =================================================
// Send message ===================================================
app.post('/send', jsonParser, [
  body('number').notEmpty(),
  body('message').notEmpty(),
  body('token').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });
  const message = req.body.message;
  //==== CEK READY
  if(!cek_ready(res)){return;}
  //==== CEK API-KEY
  const token = cektoken(req.body.token);
  if(!token){r200('API-KEY-SALAH',res);return;}
  //==== CEK NO WA START
  const number = phoneNumberFormatter(req.body.number);
  const cekno = await cek_nomor(number,res);
  if(!cekno){return;}
  //==== CEK NO WA STOP
  //==== CEK ERROR
  if(!errors.isEmpty()){r200(errors.mapped(),res);return;}
   //==== KIRIM PESAN
   kirim(number, message,res);
});
// END LINE =====================================================
/**==============================================================
 * APP EXPRESS END
 ===============================================================*/
/**==============================================================
 * CLIENT WHATSAPP START
 ===============================================================*/
//---------------------------------------------
client.on('qr', (qr) => {
  qrcode_return = qr;
  console.log('QR RECEIVED', '200');
});
//---------------------------------------------
//---------------------------------------------
client.on('authenticated', () => {
  console.log('AUTHENTICATED');
});
//---------------------------------------------
//---------------------------------------------
client.on('auth_failure', msg => {
  // Fired if session restore was unsuccessful
  console.error('AUTHENTICATION FAILURE', msg);
  client.initialize();
  status = "NOT READY";
});
//---------------------------------------------
//---------------------------------------------
client.on('ready', () => {
  status = "READY";
  console.log('READY');
});
//---------------------------------------------
//---------------------------------------------
client.on('message', message  => {
  // console.log(message.body);
  let from = message.from;
  let msg = message.body;
  let id_pesan = message.id;
  axios
  .post(base_url+'whatsapp/auth_reply', {
  nomor: from,
  pesan: msg,
  id_pesan: id_pesan
  })
  .then(async (res) => {
      const number = phoneNumberFormatter(from);
    if(res.data.id==1){
      
      client.sendMessage(number,res.data.msg)
       // console.log(res.data.msg) 
      
    }else if(res.data.id==2){
      
        const caption = res.data.caption;
        const file = res.data.file;
        let mimetype;
        const attachment = await axios.get(base_url+'file/wa_media/'+file, {
          responseType: 'arraybuffer'
            }).then(response => {
              mimetype = response.headers['content-type'];
              return response.data.toString('base64');
            });

      const media = new MessageMedia(mimetype, attachment, 'Media');

      client.sendMessage(number, media, {
        caption: caption
      })
       // console.log(res.data.file) 
    }else{
    return;
    }
    
  // console.log(`statusCode: ${res.statusCode}`)
  // console.log(res)
  })
  .catch(error => {
    return;
  // console.error(error)
  });
});
//---------------------------------------------
//---------------------------------------------
client.on('change_state', state => {
  console.log('CHANGE STATE', state );
});
//---------------------------------------------
//---------------------------------------------
client.on('disconnected', (reason) => {
  console.log('Client was logged out', reason);
  status = "NOT READY";
  client.initialize();
});
//---------------------------------------------
/**==============================================================
 * CLIENT WHATSAPP END
 ===============================================================*/
server.listen(port, function() {
  console.log('APLIKASI BERJALAN PADA PORT : ' + port);
});

//#############################################
function cek_ready(res){
  if(status == "NOT READY"){
    res.status(200).json({
        status: true,
        msg: 'Whatsapp Belum Siap <br> Silahkan Scan terlebih dahulu.'
    });
    return false;
  }else{
    return true;
  }
}
//#############################################
//#############################################
function r200(msg,res){
 res.status(200).json({
      status: true,
      msg: msg
    });
}
//#############################################
//#############################################
async function cek_nomor(number,res){
  const isRegisteredNumber = await checkRegisteredNumber(number);
       if(!isRegisteredNumber){
        res.status(200).json({
        status: true,
        msg: 'No HP Belum Terdaftar Whatsapp'
        });
         return false;
     }else{
         return true;
     }
}
//#############################################
//#############################################
function state(val){
  client.getState().then((res) => { 
    return (res==val)?true:false;
  });
}
//#############################################
//#############################################
function kirim(no,msg,res){
   client.sendMessage(no, msg).then(response => {
    res.status(200).json({
        status: true,
        msg: "Terkirim",
        data: {response}
      });
    }).catch(err => {
     res.status(200).json({
        status: true,
        msg: "Gagal terkirim",
        data: {err}
      });
    });
  return;
}
//#############################################