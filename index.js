import fs from "fs";
import path from "path";
import express from "express";
import chalk from "chalk";
import bodyParser from "body-parser";
import { exec } from "child_process";

const app = express();

app.use(bodyParser.json());

//check if the repos folder exists
if (!fs.existsSync(path.resolve("repos"))) {
  fs.mkdirSync(path.resolve("repos"));
}

//chimble

app.get("/", (req, res) => {
  const mainHtml = fs.readFileSync(path.resolve("index.html"), "utf-8");
  res.send(mainHtml);
});

app.get("/index/:fileName", (req, res) => {
  const fileName = req.params.fileName;
  res.sendFile(path.resolve(fileName));
});

app.post("/clone", async (req, res) => {
  const { gitUrl } = req.body;
  const repoName = gitUrl.split("/").pop().replace(".git", "");
  const checkIfRepoExists = fs.existsSync(path.resolve(`repos/${repoName}`));
    if (checkIfRepoExists) {
        return res.status(400).json({ error: "Repo already exists", url: repoName });
    }
  exec(`git clone ${gitUrl} repos/${repoName}`, (error) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ url: repoName });
  });
});


app.use('/', express.static(path.resolve('repos'), { index: false }));


app.use('/:repoName', (req, res, next) => {
  const repoName = req.params.repoName;
  const repoPath = path.resolve(`repos/${repoName}`);
  
  if (!fs.existsSync(repoPath)) {
    const err404Html = fs.readFileSync(path.resolve("404.html"), "utf-8");
    const err404HtmlWithMessage = err404Html.replace("{{message}}", "Repo not found");
    return res.status(404).send(err404HtmlWithMessage);
  }

  if(!fs.existsSync(path.resolve(repoPath, 'index.html'))) {
    const err404Html = fs.readFileSync(path.resolve("404.html"), "utf-8");
    const err404HtmlWithMessage = err404Html.replace("{{message}}", "index.html not found");
    return res.status(404).send(err404HtmlWithMessage);
    } 
  
  express.static(repoPath)(req, res, next);
});

app.use((req, res) => {
  const err404Html = fs.readFileSync(path.resolve("404.html"), "utf-8");
  const err404HtmlWithMessage = err404Html.replace("{{message}}", "Page not found");
  res.status(404).send(err404HtmlWithMessage);
});

app.listen(3000, () => {
  console.log(
    "Server started on: " + chalk.hex("#ed455e")("http://localhost:3000")
  );
});
