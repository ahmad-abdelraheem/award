const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const date = require('./date.js');
const time = require('./time.js');
const crypt = require('./crypt.js');
const app = express();
const port = 3000;

app.use(bodyParser.json());

app.use((req, res, next) => {
    console.log(`Incoming ${req.method} request to ${req.url}`);
    next();
  });
/*
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Madrap#28',
    database: 'mawaeed_db',
  });
  */
app.get('/getHospitals', async (req, res) => {
  const sql = 'SELECT Hos_ID AS id, Hos_Name AS name FROM hospitals';
  try {
    const [results, field] = await pool.query(sql);
    res.json(results);
  } catch(err) {
    console.error("Error while executing the query : ", err);
    res.status(500).json({error:'Error fetching hospitals.'});
  }
});

app.get('/getHospitalsByCity', async (req, res) => {
  const city = req.body.city;
  const sql = `SELECT Hos_ID AS id, Hos_Name AS name FROM hospitals
              WHERE City = '${city}'`;
  try {
    const [results, field] = await pool.query(sql);
    res.json(results);
  } catch(err) {
    console.error('Error executing the query : ',err);
    res.status(500).json({error:'error fetching hospital'});
  }
});

app.get('/getClinics', async (req, res) => {
  const clinicId = req.body.clinicId;
  const sql = `SELECT Cli_ID AS id, Specialization AS name FROM clinics
              WHERE Cli_ID = '${clinicId}'`;
  try {
    const [results, field] = pool.query(sql);
    res.json(results);
  } catch(err) {
    console.error('Error while executing the query : ', err);
    res.status(500).json({error: 'error fetching clinics'});
  }
});

app.get('/startBooking', async (req, res) => {
  const clinicId = req.body.clinicId;
  const dates = [];

  try {
    const results = await pool.query(`SELECT MAX(App_Date) AS maxDate, MIN(App_Date) AS minDate FROM appointment WHERE Cli_ID = '${clinicId}'`);
    const capacity = await pool.query(`SELECT capacity AS capacity FROM clinics WHERE Cli_ID = '${clinicId}'`);
    const minDate = results[0][0].minDate;
    const maxDate = results[0][0].maxDate;
    const tomorrow = date.nearestDay(new Date());

    if (minDate != null) {
      dates.push({
        date: `${date.formatDate(tomorrow)}`,
        capacity: capacity[0][0].capacity,
        turns: []
      });

      for (let i = 0; i < 9; i++) {
        dates.push({
          date: `${date.formatDate(date.nearestDay(tomorrow))}`,
          capacity: capacity[0][0].capacity,
          turns: []
        });
      }
    } else {  // if(minDate != null)
      const minDateJordan = date.toJordan(minDate);
      const maxDateJordan = date.toJordan(maxDate);

      if (minDateJordan > tomorrow) {   //#first Senario
        dates.push({
          date: `${date.formatDate(tomorrow)}`,
          capacity: capacity[0][0].capacity,
          turns: []
        });

        let i = 0;
        for (let day = date.nearestDay(tomorrow); day < minDateJordan && i < 9; date.nearestDay(day)) {
          ++i;
          dates.push({
            date: `${date.formatDate(day)}`,
            capacity: capacity[0][0].capacity,
            turns: []
          });
        }

        let day = date.nearestDay(new Date(dates[dates.length - 1].date));
        console.log(day);

        while (i < 9) {
          const turn = await pool.query(`SELECT Turn AS turn FROM appointment WHERE Cli_ID = '${clinicId}' AND App_Date = '${date.formatDate(day)}'`);
          const turns = turn[0].map(result => result.turn);

          if (turns.length < capacity) {
            dates.push({
              date: `${date.formatDate(day)}`,
              capacity: capacity[0][0].capacity,
              turns: turns
            });

            date.nearestDay(day);
            i++;
          }
        }
      } else {
        let day = date.toJordan(date.nearestDay(new Date));
        let i = 0;
        while (day < date.nextDay(new Date(date.formatDate(maxDateJordan))) && i < 10) {
          const result = await pool.query(`SELECT COUNT(App_ID) AS count, Capacity AS capacity, App_Date AS date FROM Appointment WHERE Cli_ID = '${clinicId}' AND App_Date = '${date.formatDate(day)}' GROUP BY App_Date, Capacity`);
          if (result[0].length){
            if (result[0][0].count < result[0][0].capacity){
              const turn = await pool.query(`SELECT Turn AS turn FROM appointment WHERE Cli_ID = '${clinicId}' AND App_Date = '${date.formatDate(day)}'`);
              const turns = turn[0].map(result => result.turn);
              dates.push({
                date: `${date.formatDate(day)}`,
                capacity: capacity[0][0].capacity,
                turns: turns
              });
              i++;
            }
          }
          date.nearestDay(day);
        }
        while(i < 10){
          dates.push({
            date: `${date.formatDate(day)}`,
            capacity: capacity[0][0].capacity,
            turns: []
          });
          date.nearestDay(day);
          i++;
        }

        
      }
    }
    res.json(dates);
  } catch (err) {
    console.error(`Error in '/startBooking' endpoint:`, err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/checkAvailableDate', async (req, res) => {
  const clinicId = req.body.clinicId;
  const date = req.body.date;
  const count = await pool.query(`SELECT COUNT(App_ID) AS count,Capacity AS capacity FROM appointment WHERE Cli_ID = '${clinicId}' AND App_Date = '${date}' GROUP BY capacity`);
  if(count[0][0]){
    if (count[0][0].count < count[0][0].capacity){
      const turn = await pool.query(`SELECT Turn AS turn FROM appointment WHERE Cli_ID = '${clinicId}' AND App_Date = '${date}'`);
      const turns = turn[0].map(result => result.turn);
      res.json({
        status:1,
        capacity: count[0][0].capacity,
        turns: turns
      });
    } else {
      res.json({status:0});
    } 
  } else {
    const capacity = await pool.query(`SELECT capacity AS capacity FROM clinics WHERE Cli_ID = '${clinicId}'`);
    res.json({
      status:1,
      capacity: capacity[0][0].capacity,
      turns: []
    });
  }
});

app.get('/getMyAppointments', async (req, res) => {
  try{
    const patientId = req.body.patientId;
    const appointments = [];
    const day = new Date();
    const result = await pool.query(`SELECT * FROM appointment WHERE Pat_ID = '${patientId}' AND App_Date > '${date.formatDate(day)}'`);
    if(result[0].length){
    for(let i = 0 ; i < result[0].length ; i++){
      const hosQuery = await pool.query(`SELECT Hos_Name AS hospitalName FROM hospitals WHERE Hos_ID = '${result[0][i].Hos_ID}'`);
      const hospitalName = hosQuery[0][0].hospitalName;
      const cliQuery = await pool.query(`SELECT specialization AS clinicName, Duration AS duration, Opening_Time AS time FROM clinics WHERE Cli_ID = '${result[0][i].Cli_ID}'`);
      const clinicName = cliQuery[0][0].clinicName;
      const estimaitedTime = time.addTime(cliQuery[0][0].time, cliQuery[0][0].duration * (result[0][i].Turn - 1));
      appointments.push({
        appointmentId: result[0][i].App_ID,
        hospitalName: hospitalName,
        clinicName: clinicName,
        date: date.formatDate(date.toJordan(result[0][i].App_Date)),
        estimaitedTime: estimaitedTime,
        turn: result[0][i].Turn
      });
    }
    
  }
  res.json(appointments);
  } catch(err){
    console.error('Error In \'getMyAppointment\' end point    : ',err);
    res.status(500).json({error: 'error while getting appointments'});
  }
});

app.get('/myProfile', async (req, res) => {
  const patientId = req.body.patientId;
  try {
    const result = await pool.query(`SELECT 
      Pat_ID AS nationalId,  
      First_Name AS fName,
      Second_Name AS sName,
      Third_Name AS tName,
      Last_Name AS lName,
      Phone_Number AS phoneNumber
      FROM patients WHERE Pat_ID = '${patientId}'   
    `);
    const fullName = result[0][0].fName + ' ' + result[0][0].sName + ' ' 
                    + result[0][0].tName + ' ' + result[0][0].lName;
    res.json({
      fullName: fullName,
      nationalId: result[0][0].nationalId,
      phoneNumber: result[0][0].phoneNumber
    });
    
  } catch(err){

  }
});

app.get('/getResetCode', async (req, res) => {
  const patientId = req.body.patientId;
  await pool.query(`DELETE FROM change_password_via_code WHERE Pat_ID = '${patientId}'`);
  try {
    const characters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let code = '';
    for (let i = 0 ; i < 6 ; i++){
      code += characters[Math.floor(Math.random()*characters.length)];
    }
    await pool.query(`DELETE FROM reset_password_codes WHERE Pat_ID = '${patientId}'`);
    const now = date.formateDateTime(date.toJordan(new Date()));
    const result = await pool.query(`INSERT INTO reset_password_codes values('${patientId}','${now}','${code}',0)`);
    res.status(201).send();
  }catch(err) {
    console.error('error in \'getResetCode\' endpoint   :   ', err);
    res.status(500).send();
  }
});

app.post('/makeAppointment', async (req, res) => {
  const appointmentData = req.body;
  let queryResult = await pool.query(`SELECT City_Code AS code FROM Hospitals WHERE Hos_ID = '${appointmentData.hospitalId}'`);
  const cityCode = queryResult[0][0].code;
  let appointmentId = 2000000000 + (cityCode*10000000);
  queryResult = await pool.query(`SELECT MAX(App_ID) AS id FROM appointment WHERE App_ID > '${appointmentId}' AND App_ID < '${appointmentId+10000000}'`);
  appointmentId += (queryResult[0][0].id)?queryResult[0][0].id%10000000 + 1 : 1;
  
  try {
    const result = await pool.query(`
      INSERT INTO appointment(App_ID, Pat_ID, Hos_ID, Cli_ID, App_Date, Turn)
      VALUES (
        '${appointmentId}',
        '${req.body.patientId}',
        '${req.body.hospitalId}',
        '${req.body.clinicId}',
        '${req.body.date}',
        '${req.body.turn}'
      )
    `);
  
    if(result[0].affectedRows)
        res.status(201).json({status:1});
  } catch (error) {
    console.error("Error during insertion:", error);
    res.status(500).json({status: error.sqlState});
    
  }

});

app.post('/editAppointment', async (req, res) => {
  const appointmentData = req.body;
  try {
    const result = await pool.query(`
      UPDATE appointment
      SET App_Date = '${appointmentData.newDate}',
          Turn = ${appointmentData.newTurn}
      WHERE App_ID = '${appointmentData.appointmentId}'
    `);
    if(result[0].affectedRows)
        res.status(201).json({status:1});
  } catch(err) {
    console.error("Error during insertion:", err);
    res.status(500).json({status: err.sqlState});
  }
});
/*
app.post('/login', async (req, res) => {  
  const userDetails = req.body;
  try {
    const result = await pool.query(`SELECT Pat_ID AS id,Pat_Password as password FROM patients WHERE Pat_ID = '${userDetails.patientId}'`);
    if(result[0].length){
      console.log(result[0][0].password);
      await crypt.check(userDetails.password.toString(), result[0][0].password)?
        res.status(202).send() : res.status(401).send();
    } else{
      res.status(404).send();
    }
  } catch(err) {
    console.error('error in login end point   :   ', err);
    res.status(500).json({error: 'error while check logIn'});
  }
});   // login -> logIn
*/
app.post('/logIn', (req, res) =>{
  const userDetails = req.body;
  if (userDetails.patientId == "200011074" && userDetails.password == "2000110764")
    res.status(202).send();
  else
  res.status(401).send();
});


app.post('/updatePassword', async (req, res) => {
  const updateDetails = req.body;
  try {
    const oldPassword = await pool.query(`SELECT Pat_Password AS password FROM Patients WHERE Pat_ID = '${updateDetails.patientId}'`);
    if (crypt.check(updateDetails.oldPassword, oldPassword[0][0].password)){
      const newPassword = await crypt.crypt(updateDetails.newPassword);
      const result = await pool.query(`UPDATE patients SET Pat_Password = '${newPassword}' WHERE Pat_ID = '${updateDetails.patientId}'`);
      res.status(204).send();
    } else{
      res.status(401).send();
    }
  } catch(err){
    console.log('error while Updating Password   :   ', err);
    res.status(500).send();
  }
});

app.post('/checkResetCode', async (req, res) => {
  const patientId = req.body.patientId;
  const code = req.body.code;
  try {
    const result = await pool.query(`SELECT code AS code, date AS date, attempts AS attempts FROM reset_password_codes WHERE Pat_ID = '${patientId}'`);
    
    if (result[0].length){
      const object = result[0][0];
      const timeStamp = date.timeStamp(object.date, new Date());
      
      if (timeStamp > 30 || object.attempts >= 3){
        await pool.query(`DELETE FROM reset_password_codes WHERE Pat_ID = '${patientId}'`);
        res.status(410).send();
      }else if(code === object.code) {
        await pool.query(`DELETE FROM reset_password_codes WHERE Pat_ID = '${patientId}'`);
        await pool.query(`INSERT INTO change_password_via_code VALUES('${patientId}', '${date.formateDateTime(date.toJordan(new Date()))}')`)
        res.status(200).send();
      }
      else {
        await pool.query(`UPDATE reset_password_codes SET attempts = ${object.attempts + 1}`);
        res.status(401).send();
      }
    } else {
      res.status(410).send();
    }    
  } catch (err) {
    console.error('error in \'checkResetCode\' end point   :   ', err);
    res.status(500).send();
  }
  
});

app.post('/updatePasswordViaCode', async (req, res) => {
  const patientId = req.body.patientId;
  const password = req.body.password;
  try{
    const result = await pool.query(`SELECT date AS date FROM change_password_via_code WHERE Pat_ID = '${password}'`);
    if (result[0].length){
      const timeStamp = date.timeStamp(result[0][0].date, new Date());
      if (timeStamp > 10){
        res.status(410).send();
      } else{
        await pool.query(`DELETE FROM change_password_via_code WHERE Pat_ID = '${patientId}'`);
        const hachedPassword = crypt.crypt(password);
        await pool.query(`UPDATE patients SET Pat_Password = '${hachedPassword}' WHERE Pat_ID = '${patientId}'`);
        res.status(201).send();
      }
    } else{
      res.status(410).send();
    }
  } catch(err){
    console.error('error in \'/updatePasswordViaCode\' end point  :  ', err);
    res.status(500).send();
  }

});

app.delete('/deleteAppointment', async (req, res) =>{
  const appointmentId = req.body.appointmentId;
  try{
    const result = await pool.query(`DELETE FROM appointment WHERE App_ID = '${appointmentId}'`);
    if (result[0].affectedRows){
      res.status(200).json({status:1});
    }
  } catch(err) {
      console.log('error in \'deleteAppointment\' endpoint  :  ',err);
      res.status(500).json({error: 'error while deleting appointment.'});
  }

});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
