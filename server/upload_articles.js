
const fs = require("fs");
const rd = require('readline');
const articlesUploadDB = require('./models/articles_upload');
/******************** Articles upload to database. **********************/
let i = 0;
(function pushArticles() {
  rd.createInterface({
    input: fs.createReadStream("./articles.json"),
    console: false,
    output: null,
  }).on("line", (article) => {
    let ar;
    try {
      ar = JSON.parse(article);
      if (ar) {
        articlesUploadDB.uploadArticle(
          ar["category"],
          ar["headline"],
          ar["authors"],
          ar["link"],
          ar["short_description"],
          ar["date"],
          (err, data) => {
            if (err) {
              console.log(err);
            } else {
              console.log(`${++i} files uploaded`);
            }
          }
        );
      }
    } catch (error) {
      console.log(error);
    }
  }).on('close', ()=> {
    console.log(`*********done with ${i} articles uploaded*******`);
  });
})();