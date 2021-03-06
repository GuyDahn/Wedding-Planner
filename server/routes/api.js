const express = require('express')
const router = express.Router()
const Sequelize = require('sequelize')
const db = new Sequelize('mysql://root:@localhost/weddingPlanner')
const bcrypt = require('bcryptjs')
const saltRounds = 10

router.get('/attractions/', async function(req, res) {
	try {
		let attractions = await db.query(`SELECT * FROM attractions`)
		res.send(attractions[0])
	} catch (err) {
		console.log(err)
		res.send(err)
	}
})

router.get('/wedding-details/:userId', async (req, res) => {
	try {
		let userId = req.params.userId
		let weddingDetails = await db.query(
			`SELECT wd.* FROM user as u, weddingDetails AS wd WHERE u.id = "${userId}" AND u.id = wd.user_id`
		)
		res.send(weddingDetails[0][0])
	} catch (err) {
		res.send(err)
	}
})

router.get('/favorites/:userId', async function(req, res) {
	try {
		let userId = req.params.userId
		let favorites = await db.query(
			`SELECT at.* FROM attractions as at, user as u, favorites as f WHERE u.id = "${userId}" AND f.user_id = "${userId}" AND f.attraction_id = at.id`
		)
		res.send(favorites[0])
	} catch (err) {
		console.log(err)
		res.send(err)
	}
})

router.get('/bookedAttractions/:userId', async function(req, res) {
	let userId = req.params.userId
	try {
		let bookedAttractions = await db.query(
			`SELECT at.*, ba.price
        FROM attractions as at,user as u,booked_attractions as ba 
        WHERE ba.user_id = "${userId}" AND ba.attraction_id=at.id AND u.id = "${userId}"`
		)
		res.send(bookedAttractions[0])
	} catch (err) {
		console.log(err)
		res.send(err)
	}
})

router.post('/attractions/favorite', async function(req, res) {
	try {
		let favorite = req.body
		let result = await db.query(
			`SELECT f.* FROM  favorites as f 
             WHERE f.user_id = "${favorite.userId}"
             AND f.attraction_id = "${favorite.attractionId}"`
		)
		if (result[0].length === 0)
			await db.query(
				`INSERT INTO favorites VALUES("${favorite.userId}", "${favorite.attractionId}")`
			)
		res.send('succesfully added to favorites')
	} catch (err) {
		console.log(err)
		res.send(err)
	}
})

router.post('/attractions/book', async function(req, res) {
	let action = req.body
	try {
		let result = await db.query(
			`SELECT ba.* FROM  booked_attractions as ba 
             WHERE ba.user_id = "${action.userId}"
             AND ba.attraction_id = "${action.attractionId}"`
		)
		if (result[0].length === 0)
			await db.query(
				`INSERT INTO booked_attractions VALUES("${action.userId}", "${action.attractionId}", "${action.price}")`
			)
		res.end()
	} catch (err) {
		console.log(err)
		res.send(err)
	}
})
router.put('/update/UserInfo', async function(req, res) {
	let userInfo = req.body
	try {
		await db.query(
			`UPDATE weddingdetails
			SET 
				groom_name = "${userInfo.groom_name}", 
 				bride_name = "${userInfo.bride_name}", 
 				wedding_date = "${userInfo.wedding_date}", 
 				est_invitees = "${userInfo.est_invitees}",
 				est_budget = "${userInfo.est_budget}",  
 				wedding_area = "${userInfo.wedding_area}" 
			WHERE 
				user_id="${userInfo.user_id}"`
		)
		res.send('Your info has been successfully updated!')
	} catch (err) {
		res.status(400).json({message: err.message})
	}
})

router.post('/register', async function(req, res) {
	try {
		let user = req.body.userData
		let encryptedPassword = await bcrypt.hash(user.fPassword, saltRounds)
		let userCheck = await db.query(
			`SELECT * FROM user WHERE email = "${user.email}"`
		)
		if (userCheck[0].length)
			throw new Error('Oops, This email belongs to another user')
		let newUser = await db.query(
			`INSERT INTO user VALUES(null,'${user.email}','${encryptedPassword}')`
		)
		await db.query(
			`INSERT INTO weddingdetails VALUES(null, '${user.gName}','${user.bName}','${user.weddingDate}','${user.estInvitees}','${user.weddingBudget}',null,'${user.weddingArea}',null,'${newUser[0]}')`
		)
		res.send({ newUser, message: 'Congrats! you have succesfully registered.' })
	} catch (err) {
		res.status(400).json({ message: err.message })
	}
})

router.post('/login', async function(req, res) {
	try {
		let user = req.body
		let result = await db.query(
			`SELECT * FROM user WHERE email = "${user.email}"`
		)
		if (result[0].length === 0) throw new Error('User details are incorrect')
		let samePass = await bcrypt.compare(user.password, result[0][0].password)
		if (samePass) {
			let userId = result[0][0].id
			res.send({ id: userId })
		} else {
			throw new Error('Incorrect password')
		}
	} catch (err) {
		res.status(400).json({ message: err.message })
	}
})

router.delete('/favorite', async function(req, res) {
	try {
		let favorite = req.body
		await db.query(
			`DELETE FROM favorites WHERE user_id = "${favorite.userId}" AND attraction_id = "${favorite.attractionId}"`
		)
		res.send(`Succesfully removed from favorites`)
	} catch (err) {
		res.send(err)
	}
})

router.post('/invitee', async function(req, res) {
	try {
		console.log(req.body.inviteeData)
		let invitee = req.body.inviteeData
		await db.query(
			`INSERT INTO invitee VALUES(null,'${invitee.name}','${invitee.num_invitees}',0,'${invitee.relation}','${invitee.phone}','${invitee.email}','${req.body.weddingDataId}',null)`
		)
		res.send(`${invitee.name} has been added to your guest list!`)
	} catch (err) {
		console.log(err)
		res.status(400).json({ message: err.message })
	}
})

router.get('/invitees/:weddingDetailsId', async function(req, res) {
	try {
		let weddingDetailsId = req.params.weddingDetailsId
		let invitees = await db.query(
			`SELECT * FROM invitee WHERE wedding_id = ${weddingDetailsId}`
		)
		res.send(invitees)
	} catch (err) {
		res.status(400).json({ message: err.message })
	}
})

router.post('/table', async function(req, res) {
	try {
		let tableData = req.body.tableData
		let tableNumber = req.body.numTables + 1
		let weddingDetailsId = req.body.weddingDetailsId
		await db.query(
			`INSERT INTO tables VALUES(null,'${tableData.tableName}','${tableNumber}','${tableData.numSeats}',0,'${weddingDetailsId}')`
		)
		res.send(`${tableNumber} table created successfully`)
	} catch (err) {
		console.log(err)
		res.status(400).json({ message: err.message })
	}
})

router.put('/invitee/addtotable', async (req, res) => {
	try {
		let inviteeId = req.body.invitee.id
		let newTable = req.body.currenTable
		let addSeatsNum = req.body.invitee.num_invitees
		let inviteeOldTable = req.body.oldTable || 0
		if (inviteeOldTable)
			await db.query(
				`UPDATE tables SET seated = "${inviteeOldTable.seated -
					addSeatsNum}" where id="${inviteeOldTable.id}"`
			)
		await db.query(
			`UPDATE invitee SET table_id = "${newTable.id}" WHERE id = "${inviteeId}"`
		)
		await db.query(
			`UPDATE tables SET seated = "${newTable.seated +
				addSeatsNum}" where id="${newTable.id}"`
		)
		res.send(`Your guest has succesfully added to this table`)
	} catch (err) {
		res.status(400).json({ message: err.message })
	}
})
router.put('/invitee/removeFromTable', async (req, res) => {
	try {
		let inviteeId = req.body.invitee.id
		let removeTable = req.body.currenTable
		let addSeatsNum = req.body.invitee.num_invitees
		await db.query(
			`UPDATE tables SET seated = "${removeTable.seated -
				addSeatsNum}" where id="${removeTable.id}"`
		)
		await db.query(
			`UPDATE invitee SET table_id = null WHERE id = "${inviteeId}"`
		)
		res.send(`Your guest has succesfully removed from table`)
	} catch (err) {
		res.status(400).json({ message: err.message })
	}
})

router.get('/tables/availableseats/:tableId', async (req, res) => {
	try {
		let tableId = req.params.tableId
		let seats = await db.query(
			`SELECT seated FROM tables WHERE id = "${tableId}"`
		)
		res.send(seats[0][0])
	} catch (err) {
		console.log(err)
		res.send(err.message)
	}
})

router.get('/tables/:weddingDetailsId', async function(req, res) {
	try {
		let weddingDetailsId = req.params.weddingDetailsId
		let tables = await db.query(
			`SELECT * FROM tables WHERE wedding_id = ${weddingDetailsId}`
		)
		res.send(tables)
	} catch (err) {
		res.status(400).json({ message: err.message })
	}
})

module.exports = router
