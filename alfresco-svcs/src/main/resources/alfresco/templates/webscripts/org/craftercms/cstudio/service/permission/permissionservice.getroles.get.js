   // extract parameters
   var site = args.site;
   
   if (site == undefined || site == "")
   {
     status.code = 400;
     status.message = "Site must be provided.";
     status.redirect = true;
   } else {   
	   model.result = permissionService.getRoles(site);
  }
