'use strict';

exports.success = function(message, res){
    var data = {
        "status":200,
        "message":message
    };

    res.json(data);
    res.end();
};

exports.failed = function(message, res){
    var data = {
        "status": 400,
        "message": message
    }

    res.status(400).json(data);
    res.end();
}

exports.serverError = function(message, res){
    var data = {
        "status": 500,
        "message": "Server Error"
    }
    return;
}

/* var categoryMap = {};
var categories = [];
rows.forEach(function(row) {
   var category = categoryMap[row.categoryTitle];
   if (!category) {
      category = {
         categoryTitle: row.categoryTitle,
         categoryIcon: row.categoryIcon,
         subCategory: []
      };

      categoryMap[row.categoryTitle] = category;
      categories.push(category);
   }

   category.subCategory.push({
     subCategoryTitle: row.subCategoryTitle,
     subCategoryIcon: row.subCategoryIcon
   });
});

response.json(categories);*/

exports.successNested = function(values, res){
    const hasil = values.reduce((akumulasikan, item) => {
        
    }, {});
    
    var data = {
        "status": 200,
        "values": hasil
    }

    res.status(200).json(data);
    res.end();
}

/* Response yang diinginkan */
/* 
    {
        "transfer":[
            {
                ...
            },
            {
                ...
            }
        ],

        "bayar":[
            {
                ...
            },
            {
                ...
            }
        ],

        "top up":[
            {
                ...
            },
            {
                ...
            }
        ]

    }
*/