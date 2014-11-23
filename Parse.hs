-- TODO dependencies
module Main where
import System.Environment
import Data.List (partition, foldl')

main :: IO ()
main = do
  args <- getArgs
  case args of
    [input] ->                   putStr . printSig . mergeSigs . parseFile =<< readFile input
    [input, output] -> writeFile output . printSig . mergeSigs . parseFile =<< readFile input
    _ -> putStrLn "main. Usage Error"

type Signature = ([String], ([String], [String]))
step (l1, r1) (l2, r2) =
  let (have, need) = partition (`elem` r1) l2
    in (l1 ++ need, r1 ++ r2)
mergeSigs :: [Signature] -> Signature
mergeSigs = foldl' p ([],([],[]))
 where
   p (c1,p1) (c2,p2) = (c1++c2, step p1 p2)

parseFile :: String -> [Signature]
parseFile = map parseLine . lines
parseLine :: String -> Signature
parseLine str =
  let ws = words str
      (inputs, rest) = partition isInput ws
      (outputs, _)   = partition isOutput rest
  in
    ([str], (map unInput inputs, map unOutput outputs))
printSig :: Signature -> String
printSig (cs, (inputs, outputs)) =
  unlines $
    [unlines $ map unCommand cs, unwords inputs, unwords outputs]

specialChar = '→'
isInput [] = False
isInput (c : _) = c == specialChar
isOutput [] = False
isOutput x = let c = last x in c == specialChar
unInput = tail
unOutput = init

unCommand = unwords . map unWord . words
unWord x | isInput x = unInput x
unWord x | isOutput x = unOutput x
unWord x = x
