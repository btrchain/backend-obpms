// const { google } = require("googleapis");
const nodemailer = require("nodemailer");

const sendEmail = async (options)=>{
     
    const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "obmps.btrchain@gmail.com",
          pass:"Qwert@12345"
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