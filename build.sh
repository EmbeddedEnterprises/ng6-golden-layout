#!/bin/bash -e

ORG="@embedded-enterprises"

echo "This scripts builds the projects."
echo "Building $ORG/ng6-golden-layout"
ng build ee-golden-layout
echo "Linking $ORG/ng6-golden-layout"
rm -f node_modules/$ORG/ng6-golden-layout
mkdir -p node_modules/$ORG
ln -s ../../dist/$ORG/ng6-golden-layout node_modules/$ORG/ng6-golden-layout

echo "Building testbed"
ng build testbed
