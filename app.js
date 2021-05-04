//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const MongoClient = require("mongodb").MongoClient;

const app = express();

const uri =
  "mongodb+srv://fadeAway:petarmongodb@cluster0.4wwjt.mongodb.net/anketa?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/link", (req, res) => {
  res.render("link");
});

app.get("/confirm", (req, res) => {
  res.render("confirm");
});

app.get("/noMoreLinks", (req, res) => {
  res.render("noMoreLinks");
});

app.post("/link", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  client.connect((err) => {
    const users = client.db("anketa").collection("users");
    const links = client.db("anketa").collection("links");

    users.findOne({ user: username }, (err, foundUser) => {
      if (err) {
        console.log(err);
      } else {
        if (foundUser && foundUser.pass === password) {
          const unvisitedLinksLength = foundUser.unvisitedLinks.length;
          const currentLinkLength = foundUser.currentLink.length;
          if (currentLinkLength === 0) {
            res.render("noMoreLinks");
            return;
          }
          // const currentTime = Date.now();
          // if (
          //   foundUser.timeFinished &&
          //   currentTime - foundUser.timeFinished < 18 * 60 * 60 * 1000
          // ) {
          //   res.render("link", { link: "Sacekaj jos malo" });
          //   return;
          // }
          if (unvisitedLinksLength === 20) {
            links.findOne({ id: 1 }, (err, foundLink) => {
              if (err) {
                console.log(err);
              } else {
                res.render("link", {
                  link: foundLink.path,
                });
                users.update(
                  { user: foundUser.user },
                  { $set: { currentLink: foundLink.id } }
                );
              }
            });
          } else {
            let randomNumber = Math.floor(Math.random() * unvisitedLinksLength);
            links.findOne(
              { id: foundUser.unvisitedLinks[randomNumber] },
              (err, foundLink) => {
                res.render("link", {
                  link: foundLink.path,
                });
                users.update(
                  { user: foundUser.user },
                  { $set: { currentLink: foundLink.id } }
                );
              }
            );
          }
        }
      }
    });
  });
});

app.post("/confirm", (req, res) => {
  const username = req.body.username;
  client.connect((err) => {
    const users = client.db("anketa").collection("users");

    users.findOne({ user: username }, (err, foundUser) => {
      const currentLinkId = foundUser.currentLink;
      const unvisitedLinks = foundUser.unvisitedLinks;
      const newUnvisitedLinks = unvisitedLinks.filter(
        (linkId) => linkId !== currentLinkId
      );
      users.update(
        { user: foundUser.user },
        {
          $set: { unvisitedLinks: newUnvisitedLinks, timeFinished: Date.now() },
        }
      );
    });
  });
  res.render("login");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, () => {
  console.log("server started successfully");
});
