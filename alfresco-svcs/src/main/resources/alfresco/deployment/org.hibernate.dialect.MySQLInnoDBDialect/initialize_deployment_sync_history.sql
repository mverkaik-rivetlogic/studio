CREATE  TABLE `cstudio_deploymentsynchistory` (
  `id` BIGINT NOT NULL AUTO_INCREMENT ,
  `syncdate` DATETIME NOT NULL ,
  `site` VARCHAR(50) NOT NULL ,
  `environment` VARCHAR(20) NOT NULL ,
  `path` TEXT NOT NULL ,
  `target` VARCHAR(50) NOT NULL ,
  `username` VARCHAR(25) NOT NULL ,
  `contenttypeclass` VARCHAR(25) NOT NULL ,
  PRIMARY KEY (`id`) ,
  INDEX `cs_depsynchist_site_idx` (`site` ASC) ,
  INDEX `cs_depsynchist_env_idx` (`environment` ASC) ,
  INDEX `cs_depsynchist_path_idx` (`path`(250) ASC) ,
  INDEX `cs_depsynchist_sitepath_idx` (`site` ASC, `path`(250) ASC) ,
  INDEX `cs_depsynchist_target_idx` (`target` ASC) ,
  INDEX `cs_depsynchist_user_idx` (`username` ASC) ,
  INDEX `cs_depsynchist_ctc_idx` (`contenttypeclass` ASC));