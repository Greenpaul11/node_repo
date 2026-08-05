import { Product } from "./models";
import dotenv from 'dotenv';
dotenv.config({
    path: 'config/.env' 
});




console.dir(Product.getAttributes().id, { depth: 0});