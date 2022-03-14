const { google } = require("googleapis");
const nodemailer = require("nodemailer");


const client_id =
  "30915224099-qm7obopskq37tikbr5c3jlp7ovvf3usb.apps.googleusercontent.com";
const client_secret = "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";
const redirect_uri = "https://developers.google.com/oauthplayground";
const refresh_token =
  "1//04utm23QPIkRFCgYIARAAGAQSNwF-L9IrNMo5wAeStRCygQhx_Fr-KItKbOOUHncql_FJWplrAnVavxt8PN6t0ngKp7PR6THynZ4";

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uri
);
oAuth2Client.setCredentials({ refresh_token: refresh_token });


const sendEmail = async (options)=>{

    const accessToken = await oAuth2Client.getAccessToken();
     
    const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: "obmps.btrchain@gmail.com",
          clientId: client_id,
          clientSecret: client_secret,
          refreshToken: refresh_token,
          accessToken: accessToken,
        },
      }); 
    
     const mailOption = {
        from: `Parlour <obmps.btrchain@gmail.com>`,
        to: options.email,
        subject: options.subject,
        html: options.message,
    };  
    
  return  await transport.sendMail(mailOption);
      

}


module.exports = sendEmail