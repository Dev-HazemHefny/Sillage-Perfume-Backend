const categoryRouter = express.Router();

categoryRouter.post("/create", craeteValidator, handleValidationErrors, createCategory);





