import express from 'express';
import userRoutes from './routes/user';
import toolRoutes from './routes/tool'
import authRoutes from './routes/auth'
import cors from 'cors'
const app = express();
app.use(express.json());

app.use(cors())


// Correctly mount router here:
app.use('/api/user', userRoutes);
app.use('/api/tools',toolRoutes);
app.use('/api/auth',authRoutes)


app.get("/",(req,res)=>{res.send("hii there the test is working")})

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
