var gm = require('gm');

module.exports = function(params,img_stream,cb){
  if(params.sw && params.sh){
    return resizeStream(params,img_stream,cb);
  } else {
    return slowResizeStream(params,img_stream,cb);
  }
}

var resizeStream = function(params,img_stream,cb){
  var time = Date.now();
  var crop = getCropStats(params);

  gm(img_stream)
    .crop(crop.width,crop.height,crop.x,crop.y)
    .resize(params.w,params.h)
    .stream(function(err,stdout,stderr){
        if(err) console.log('gm ERR:',err);
        console.log('pipe begin', Date.now()-time);
        stdout.on('end',function(){
          console.log('pipe end', Date.now()-time);
        });
        stderr.on('data',function(chunk){
          console.log('gm ERROR:',chunk);
        });
        cb(err,stdout,stderr);
    });
};

var slowResizeStream = function(params,img_stream,cb){
  var time = Date.now();

  gm(img_stream)
    .size({bufferStream: true},function(err,size){
      params.sw = size.width;
      params.sh = size.height;
      var crop = getCropStats(params);
      this.crop(crop.width,crop.height,crop.x,crop.y)
      .resize(params.w,params.h)
      .stream(function(err,stdout,stderr){
          if(err) console.log('gm ERR:',err);
          console.log('pipe begin', Date.now()-time);
          stdout.on('end',function(){
            console.log('pipe end', Date.now()-time);
          });
          stderr.on('data',function(chunk){
            console.log('gm ERROR:',chunk);
          });
          cb(err,stdout,stderr);
      });
    });
};

var getCropStats = function(params){
  var target = {
    width: Number(params.w),
    height: Number(params.h)
  };
  var start = { 
    width: Number(params.sw),
    height: Number(params.sh)
  };
 
  var start_ratio = start.width / start.height;
  var target_ratio = target.width / target.height;
  
  var crop = {
    width:start.width,
    height:start.height,
    x:0,
    y:0
  };

  if(start_ratio < target_ratio){
    var ratio = (1 - (start_ratio / target_ratio));
    crop.height = start.height - start.height*ratio;
    crop.y = (start.height - crop.height)/2;
  }else{
    var ratio = (1 - (target_ratio / start_ratio));
    crop.width = start.width - start.width*ratio;
    crop.x = (start.width - crop.width)/2;
  }

  return crop;
};
