-- TODO make the 
module Main where
import System.Environment
import System.FilePath
import Data.List (partition, foldl')

type Name = Int
type Signature = ([String], ([String], [String]))
(.>) = flip (.)

main :: IO ()
main = getArgs >>= main'

main' :: [String] -> IO ()
main' args =
  case args of
    --[input] ->                   putStr . printSig . mergeSigs . parseFile =<< readFile input
    --[input, output] -> writeFile output . printSig . mergeSigs . parseFile =<< readFile input
    [input] -> go input Nothing
    [input, output_dir] -> go input (Just output_dir)
      
    _ -> putStrLn "main. Usage Error"
  where
   go input mdir = readFile input >>= lines .> map parseLine .> nameSigs .> mapM_ (writeCommand mdir)

parseLine :: String -> Signature
parseLine str =
  let ws = words str
      (inputs, rest) = partition isInput ws
      (outputs, _)   = partition isOutput rest
  in
    ([str], (map unInput inputs, map unOutput outputs))

nameSigs :: [Signature] -> [(Name, Signature)]
nameSigs = zip [0..]

printSig :: Signature -> String
printSig (cs, (inputs, outputs)) =
  unlines $
    inputs ++ [""] ++ outputs ++ [""] ++ map unCommand cs

writeCommand mdir (label, sig) =
  case mdir of
    Nothing  -> putStrLn $ show label ++ ":\n" ++ printSig sig
    Just dir -> writeFile (joinPath [dir, show label]) $ printSig sig

parseFile :: String -> [Signature]
parseFile = map parseLine . lines

mergeSigs :: [Signature] -> Signature
mergeSigs = foldl' p ([],([],[]))
 where
   p (c1,p1) (c2,p2) = (c1++c2, step p1 p2)
step (l1, r1) (l2, r2) =
  let (have, need) = partition (`elem` r1) l2
    in (l1 ++ need, r1 ++ r2)

specialChar = '→'
isInput [] = False
isInput (c : _) = c == specialChar
isOutput [] = False
isOutput x = let c = last x in c == specialChar
unInput (c : '.' : '/' : rest) | c == specialChar = rest
unInput x = tail x
unOutput = init

-- TODO make this just filter out all '→'
-- okay if it doesn't call unInput/unOutput, good to be very simple lexical thing
unCommand = unwords . map unWord . words
unWord x | isInput x = tail x
unWord x | isOutput x = unOutput x
unWord x = x
