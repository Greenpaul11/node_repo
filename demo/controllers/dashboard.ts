import { Request, Response } from "express"


export class AdminDashboardController {

   async adminDashboard(req: Request, res: Response) {
        res.status(200)
        res.render('admin/dashboard', {
            nextSubElement: 'partials/dashboard'
        })
    }
}