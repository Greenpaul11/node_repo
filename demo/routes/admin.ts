import express from "express";
import { LaptopRepository } from "../repositories/entityRepositories/products/laptop/laptopRepository"
import { PriceRepository } from "../repositories/entityRepositories/price/priceRepository";
import { UserRepository } from "../repositories/entityRepositories/user/userRepository";
import { UserTokenRepository } from "../repositories/entityRepositories/userToken/userTokenRepository";
import { CollectJobRepository } from "../repositories/entityRepositories/collectJob/collectJobRepository";
import { AdminDashboardController } from "../controllers/admin/dashboard";
import { AdminUserController } from "../controllers/admin/user";
import { AdminLaptopController } from "../controllers/admin/laptop";
import { AdminCollectorController } from "../controllers/admin/collector";
import { AdminMaintainerController } from "../controllers/admin/maintainer";

import { Repository } from "../../src/index.js";
import { 
    userMetadata,
    userTokenMetadata,
    laptopMetadata,
    priceMetadata

} from "../repository/metadata.js";
import { connection, User, Laptop, Price, UserToken } from "../repository/models.js"


 // initialize repositories
const userRepository = await Repository.init(connection, userMetadata, User)
const userTokenRepository = await Repository.init(connection, userTokenMetadata, UserToken)
const laptopRepository = await Repository.init(connection, laptopMetadata, Laptop)
const priceRepository = await Repository.init(connection, priceMetadata, Price)


// controllers
const dashboard = new AdminDashboardController()
const user = new AdminUserController(userRepository, userTokenRepository)
const laptop = new AdminLaptopController(laptopRepository, priceRepository)
const collector = new AdminCollectorController(collectJobRepository, laptopRepository)
const maintainer = new AdminMaintainerController()

const router = express.Router()


router.get('/dashboard', dashboard.adminDashboard.bind(dashboard))
router.get('/user', user.getUsers.bind(user))
router.post('/user/create', user.createUser.bind(user))
router.post('/user/update', user.updateUsers.bind(user))
router.post('/user/delete', user.deleteUser.bind(user))

router.get('/user_token', user.getUserTokens.bind(user))
router.post('/user_token/create', user.createUserToken.bind(user))
router.post('/user_token/update', user.updateUserToken.bind(user))
router.post('/user_token/delete', user.deleteUserToken.bind(user))

router.get('/laptop', laptop.getLaptops.bind(laptop))
router.post('/laptop/create', laptop.createLaptop.bind(laptop))
router.post('/laptop/update', laptop.updateLaptop.bind(laptop))
router.post('/laptop/delete', laptop.deleteLaptop.bind(laptop))

router.get('/price', laptop.getPrices.bind(laptop))
router.post('/price/create', laptop.createPrice.bind(laptop))
router.post('/price/update', laptop.updatePrice.bind(laptop))
router.post('/price/delete', laptop.deletePrice.bind(laptop))

router.get('/collector', collector.collector.bind(collector))
router.get('/collector_test', collector.collectorTest.bind(collector))
router.get('/collector/:shop', collector.collectorPartial.bind(collector))
router.get('/collector/inspect_attributes/:attribute', collector.inspectAttributes.bind(collector))
router.post('/collector/inspect_attributes/:attribute', collector.inspectAttributesPost.bind(collector))
router.post('/request_job', collector.requestJob.bind(collector))
router.get('/listen_to_job/:job', collector.listenToJob.bind(collector))
router.get('/settings/collector', collector.collectorSettings.bind(collector))

router.post('/config_jobs/:job', collector.jobsConfigPost.bind(collector))

router.get('/file/:path', collector.readFile.bind(collector))
router.get('/file_with_img/:path', collector.readFileWithImg.bind(collector))

router.get('/maintainer', maintainer.maintainer.bind(maintainer))
router.get('/settings/maintainer', maintainer.maintainerSettings.bind(maintainer))
router.post('/settings/maintainer', maintainer.maintainerSettingsPost.bind(maintainer))

export default router

