import { Product } from "./models";
import { productMetadata } from "./config";
import { Repository } from "../../src/repository/repository";
import connection from "../../config/connection";



const ProductRepository = (async () => Repository.init(connection, productMetadata, Product))()
console.log(ProductRepository)
