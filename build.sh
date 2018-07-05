#!/bin/bash -e

ORG="@embedded-enterprises"
PKG="ng6-golden-layout"

echo "This scripts builds the projects."
echo "Building $ORG/$PKG"
ng build ee-golden-layout
echo "Copying readme"
cp README.md dist/$ORG/$PKG
echo "Repacking lib"
(cd dist/$ORG/$PKG && tar czvf ../$PKG.tgz *)

echo "Linking $ORG/$PKG"
rm -f node_modules/$ORG/$PKG
mkdir -p node_modules/$ORG
ln -s ../../dist/$ORG/$PKG node_modules/$ORG/$PKG

echo "Building testbed"
ng build testbed
